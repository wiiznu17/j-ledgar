import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { KycVerificationStatus, RegistrationState } from '@prisma/client-wallet';
import { createHash, randomBytes, createCipheriv } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import {
  IGoogleKycProvider,
  IAwsKycProvider,
  IKycProvider,
} from '../integrations/interfaces/kyc-provider.interface';
import { IStorageProvider } from '../integrations/interfaces/storage-provider.interface';

@Injectable()
export class KycService {
  private readonly OCR_THRESHOLD = 0.85;

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    @Inject(IGoogleKycProvider) private readonly ocrProvider: IKycProvider,
    @Inject(IAwsKycProvider) private readonly faceProvider: IKycProvider,
    @Inject(IStorageProvider) private readonly storageProvider: IStorageProvider,
  ) {}

  /**
   * Phase 1: Upload ID Card and perform OCR
   */
  async uploadIdCard(authorization: string | undefined, idCardImage: Express.Multer.File) {
    const claims = await this.authService.verifyRegistrationToken(
      authorization,
      RegistrationState.TC_ACCEPTED,
    );

    const idCardHash = this.hashBuffer(idCardImage.buffer);
    const idCardKey = `kyc/${claims.sub}/id-card.jpg`;

    // 1. Upload to Storage
    const idCardUrl = await this.storageProvider.uploadFile(
      idCardKey,
      idCardImage.buffer,
      idCardImage.mimetype,
    );

    // 2. Perform OCR (Google Cloud Vision)
    const extraction = await this.ocrProvider.extractIdData(idCardImage.buffer);
    const idCardNumber = extraction.idCardNumber;

    // 3. Identity Deduplication (SHA-256 of Raw Data)
    const idCardToken = this.hashString(idCardNumber);
    const existingKyc = await this.prisma.kycData.findUnique({
      where: { idCardToken },
    });

    if (existingKyc && existingKyc.userId !== claims.sub) {
      throw new ConflictException('This ID card is already registered with another account');
    }

    // 4. Encryption of PII
    const encryptedId = this.encryptPii(idCardNumber);
    const encryptedName = extraction.firstName && extraction.lastName 
      ? this.encryptPii(`${extraction.firstName} ${extraction.lastName}`) 
      : null;

    // 5. AWS Liveness Session Initialization
    const livenessSessionId = await this.faceProvider.createLivenessSession!();

    // 6. Threshold Branching (Manual Review)
    // In Google Vision, detections[0].confidence is available if using specific models, 
    // for this refined logic we'll check number extraction success as a proxy or use raw OCR score if available.
    const isLowConfidence = !idCardNumber || idCardNumber.length < 13; 
    const reviewNote = isLowConfidence ? 'OCR failed to extract complete ID number' : null;

    // 7. Upsert Data
    await this.prisma.$transaction(async (tx) => {
      await tx.kycData.upsert({
        where: { userId: claims.sub },
        update: {
          idCardNumberEncrypted: encryptedId,
          idCardName: encryptedName,
          idCardToken: idCardToken,
          idCardImageUrl: idCardUrl,
          idCardImageSha256: idCardHash,
          livenessSessionId,
          reviewNote,
          ocrConfidence: isLowConfidence ? 0.5 : 0.95, // Simplified score
        },
        create: {
          userId: claims.sub,
          verificationStatus: KycVerificationStatus.PENDING,
          idCardNumberEncrypted: encryptedId,
          idCardName: encryptedName,
          idCardToken: idCardToken,
          idCardImageUrl: idCardUrl,
          idCardImageSha256: idCardHash,
          livenessSessionId,
          reviewNote,
          ocrConfidence: isLowConfidence ? 0.5 : 0.95,
        },
      });

      await tx.user.update({
        where: { id: claims.sub },
        data: { registrationState: RegistrationState.ID_CARD_UPLOADED },
      });
    });

    const regToken = await this.authService.signRegistrationToken(
      claims.sub,
      RegistrationState.ID_CARD_UPLOADED,
    );

    return {
      regToken,
      nextState: RegistrationState.ID_CARD_UPLOADED,
      extractedData: {
        idCardNumber: this.maskIdCard(idCardNumber),
        firstName: extraction.firstName,
        lastName: extraction.lastName,
        dateOfBirth: extraction.dateOfBirth,
      },
      livenessSessionId,
    };
  }

  /**
   * Phase 2: Upload Selfie and verify Identity
   */
  async submitSelfie(authorization: string | undefined, selfieImage: Express.Multer.File) {
    const claims = await this.authService.verifyRegistrationToken(
      authorization,
      RegistrationState.ID_CARD_UPLOADED,
    );

    const kyc = await this.prisma.kycData.findUnique({
      where: { userId: claims.sub },
    });

    if (!kyc || !kyc.livenessSessionId || !kyc.idCardImageUrl) {
      throw new BadRequestException('ID Card must be uploaded before selfie');
    }

    const selfieHash = this.hashBuffer(selfieImage.buffer);
    const selfieKey = `kyc/${claims.sub}/selfie.jpg`;

    // 1. Upload Selfie
    const selfieUrl = await this.storageProvider.uploadFile(
      selfieKey,
      selfieImage.buffer,
      selfieImage.mimetype,
    );

    // 2. Verify Liveness Session from AWS
    const liveness = await this.faceProvider.getLivenessResult!(kyc.livenessSessionId);
    if (!liveness.isLive) {
      throw new UnauthorizedException('Face Liveness check failed. Please retry.');
    }

    // 3. Face Comparison
    // Download ID card from storage temporarily or use buffer if available
    const idCardBuffer = await this.storageProvider.downloadFile(kyc.idCardImageUrl);
    const comparison = await this.faceProvider.compareFaces(selfieImage.buffer, idCardBuffer);

    const isMatch = comparison.isMatch && comparison.score >= 90;

    // 4. Finalize KYC
    await this.prisma.$transaction(async (tx) => {
      await tx.kycData.update({
        where: { userId: claims.sub },
        data: {
          selfieImageUrl: selfieUrl,
          selfieImageSha256: selfieHash,
          faceMatchScore: comparison.score,
          verificationStatus: isMatch ? KycVerificationStatus.APPROVED : KycVerificationStatus.REJECTED,
          verifiedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: claims.sub },
        data: {
          registrationState: RegistrationState.KYC_VERIFIED,
          // If match failed, the approval process will handle it. 
          // For now, we transition to KYC_VERIFIED to allow profile completion, 
          // but AuthService.completeRegistration will block if kyc is not APPROVED.
        },
      });
    });

    const regToken = await this.authService.signRegistrationToken(
      claims.sub,
      RegistrationState.KYC_VERIFIED,
    );

    return {
      regToken,
      nextState: RegistrationState.KYC_VERIFIED,
      isMatch,
    };
  }

  private encryptPii(data: string): string {
    const encryptionKey = this.configService.get<string>('KYC_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new InternalServerErrorException('System missing PII encryption capabilities');
    }
    const iv = randomBytes(12);
    const key = Buffer.from(encryptionKey, 'hex');
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private maskIdCard(id: string): string {
    if (id.length < 4) return id;
    return id.substring(0, 3) + 'XXXXXX' + id.substring(id.length - 4);
  }

  private hashBuffer(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private hashString(str: string): string {
    return createHash('sha256').update(str, 'utf8').digest('hex');
  }
}

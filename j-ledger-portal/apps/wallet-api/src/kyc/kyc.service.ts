import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { KycVerificationStatus, RegistrationState } from '@prisma/client-wallet';
import { createHash, randomBytes, createCipheriv } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { IKycProvider } from '../integrations/interfaces/kyc-provider.interface';
import { IStorageProvider } from '../integrations/interfaces/storage-provider.interface';

@Injectable()
export class KycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    @Inject(IKycProvider) private readonly kycProvider: IKycProvider,
    @Inject(IStorageProvider) private readonly storageProvider: IStorageProvider,
  ) {}

  async submitKyc(
    authorization: string | undefined,
    idCardImage: Express.Multer.File,
    selfieImage: Express.Multer.File,
  ) {
    // 1. Verify authorization state
    const claims = await this.authService.verifyRegistrationToken(
      authorization,
      RegistrationState.TC_ACCEPTED,
    );

    // 2. Compute hashes for database integrity records
    const idCardHash = this.hashBuffer(idCardImage.buffer);
    const selfieHash = this.hashBuffer(selfieImage.buffer);

    // 3. Store images in Object Storage (MinIO/S3)
    const idCardKey = `kyc/${claims.sub}/id-card.jpg`;
    const selfieKey = `kyc/${claims.sub}/selfie.jpg`;

    const [idCardUrl, selfieUrl] = await Promise.all([
      this.storageProvider.uploadFile(idCardKey, idCardImage.buffer, idCardImage.mimetype),
      this.storageProvider.uploadFile(selfieKey, selfieImage.buffer, selfieImage.mimetype),
    ]);

    // 4. Perform OCR and Face Match via Provider
    const extraction = await this.kycProvider.extractIdData(idCardImage.buffer);
    const comparison = await this.kycProvider.compareFaces(selfieImage.buffer, idCardImage.buffer);

    const idCardNumber = extraction.idCardNumber;
    const faceMatchScore = comparison.score;
    
    // Provide encryption of PII using AES-256-GCM (Maintain vendor independence)
    const encryptionKey = this.configService.get<string>('KYC_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new InternalServerErrorException('System missing PII encryption capabilities');
    }
    const iv = randomBytes(12);
    const key = Buffer.from(encryptionKey, 'hex'); // Requires a 64-character (32 byte) hex string
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(idCardNumber, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Store format: iv:authTag:encryptedPayload
    const encryptedId = `${iv.toString('hex')}:${authTag}:${encrypted}`;
    
    // Deterministic lookup token (hash of ID number)
    const idCardToken = this.hashString(idCardNumber); 

    // 5. Upsert KYC Data & Transition State
    await this.prisma.$transaction(async (tx) => {
      await tx.kycData.upsert({
        where: { userId: claims.sub },
        update: {
          verificationStatus: KycVerificationStatus.APPROVED,
          idCardNumberEncrypted: encryptedId,
          idCardToken: idCardToken,
          idCardImageUrl: idCardUrl,
          selfieImageUrl: selfieUrl,
          idCardImageSha256: idCardHash,
          selfieImageSha256: selfieHash,
          faceMatchScore: faceMatchScore,
          verifiedAt: new Date(),
        },
        create: {
          userId: claims.sub,
          verificationStatus: KycVerificationStatus.APPROVED,
          idCardNumberEncrypted: encryptedId,
          idCardToken: idCardToken,
          idCardImageUrl: idCardUrl,
          selfieImageUrl: selfieUrl,
          idCardImageSha256: idCardHash,
          selfieImageSha256: selfieHash,
          faceMatchScore: faceMatchScore,
          verifiedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: claims.sub },
        data: { registrationState: RegistrationState.KYC_VERIFIED },
      });
    });

    const newRegToken = await this.authService.signRegistrationToken(
      claims.sub,
      RegistrationState.KYC_VERIFIED,
    );

    return {
      regToken: newRegToken,
      nextState: RegistrationState.KYC_VERIFIED,
    };
  }

  private hashBuffer(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private hashString(str: string): string {
    return createHash('sha256').update(str, 'utf8').digest('hex');
  }
}

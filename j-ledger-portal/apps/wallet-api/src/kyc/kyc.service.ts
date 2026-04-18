import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { KycVerificationStatus, RegistrationState } from '@prisma/client-wallet';
import { createHash, randomBytes, createCipheriv } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
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

    // 2. Hash files to retain integrity records (simulating upload)
    const idCardHash = this.hashBuffer(idCardImage.buffer);
    const selfieHash = this.hashBuffer(selfieImage.buffer);

    // 3. Mock OCR and Face Match
    // In production, this would call an external verification service.
    const mockIdNumber = `1${Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0')}`;
    const mockFaceMatchScore = 0.95 + Math.random() * 0.04; // 0.95 - 0.99
    
    // Provide encryption of PII using AES-256-GCM
    const encryptionKey = this.configService.get<string>('KYC_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new InternalServerErrorException('System missing PII encryption capabilities');
    }
    const iv = randomBytes(12);
    const key = Buffer.from(encryptionKey, 'hex'); // Requires a 64-character (32 byte) hex string
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(mockIdNumber, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Store format: iv:authTag:encryptedPayload
    const encryptedId = `${iv.toString('hex')}:${authTag}:${encrypted}`;
    
    // Deterministic lookup token (hash of ID number)
    const idCardToken = this.hashString(mockIdNumber); 

    // 4. Upsert KYC Data & Transition State
    await this.prisma.$transaction(async (tx) => {
      await tx.kycData.upsert({
        where: { userId: claims.sub },
        update: {
          verificationStatus: KycVerificationStatus.APPROVED,
          idCardNumberEncrypted: encryptedId,
          idCardToken: idCardToken,
          idCardImageSha256: idCardHash,
          selfieImageSha256: selfieHash,
          faceMatchScore: mockFaceMatchScore,
          verifiedAt: new Date(),
        },
        create: {
          userId: claims.sub,
          verificationStatus: KycVerificationStatus.APPROVED,
          idCardNumberEncrypted: encryptedId,
          idCardToken: idCardToken,
          idCardImageSha256: idCardHash,
          selfieImageSha256: selfieHash,
          faceMatchScore: mockFaceMatchScore,
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

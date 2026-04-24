import {
  Injectable,
  Inject,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, createCipheriv } from 'crypto';
import {
  IGoogleKycProvider,
  IAwsKycProvider,
} from '../integrations/interfaces/kyc-provider.interface';
import { IStorageProvider } from '../integrations/interfaces/storage-provider.interface';
import {
  GOOGLE_KYC_PROVIDER,
  AWS_KYC_PROVIDER,
  STORAGE_PROVIDER,
} from '../integrations/integrations.module';

@Injectable()
export class KYCService {
  private readonly OCR_THRESHOLD = 0.85;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(GOOGLE_KYC_PROVIDER) private readonly ocrProvider: IGoogleKycProvider,
    @Inject(AWS_KYC_PROVIDER) private readonly faceProvider: IAwsKycProvider,
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: IStorageProvider,
  ) {}

  async getKYCStatus(userId: string) {
    const documents = await this.prisma.kYCDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const approvedCount = documents.filter((d) => d.status === 'APPROVED').length;
    const pendingCount = documents.filter((d) => d.status === 'PENDING').length;
    const rejectedCount = documents.filter((d) => d.status === 'REJECTED').length;

    return {
      userId,
      status: approvedCount >= 2 ? 'VERIFIED' : pendingCount > 0 ? 'PENDING' : 'NOT_STARTED',
      documents,
      summary: {
        approved: approvedCount,
        pending: pendingCount,
        rejected: rejectedCount,
      },
    };
  }

  async approveDocument(documentId: string) {
    return this.prisma.kYCDocument.update({
      where: { id: documentId },
      data: { status: 'APPROVED' },
    });
  }

  async rejectDocument(documentId: string, reason: string) {
    return this.prisma.kYCDocument.update({
      where: { id: documentId },
      data: {
        status: 'REJECTED',
        metadata: { reason },
      },
    });
  }

  async getPendingKYCList() {
    return this.prisma.kYCDocument.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getKYCHistory(userId: string) {
    return this.prisma.kYCDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Phase 1: Upload ID Card and perform OCR
   */
  async uploadIdCard(userId: string, idCardImage: Buffer) {
    const idCardHash = this.hashBuffer(idCardImage);
    const idCardKey = `kyc/${userId}/id-card.jpg`;

    // 1. Upload to Storage
    const idCardUrl = await this.storageProvider.uploadFile(idCardKey, idCardImage, 'image/jpeg');

    // 2. Perform OCR (Google Cloud Vision)
    const extraction = await this.ocrProvider.extractIdData(idCardImage);
    const idCardNumber = extraction.idCardNumber;

    if (!idCardNumber) {
      throw new BadRequestException('Failed to extract ID card number');
    }

    // 3. Identity Deduplication (SHA-256 of Raw Data)
    const idCardToken = this.hashString(idCardNumber);
    const existingKyc = await this.prisma.kYCData.findUnique({
      where: { idCardToken },
    });

    if (existingKyc && existingKyc.userId !== userId) {
      throw new ConflictException('This ID card is already registered with another account');
    }

    // 4. Encryption of PII
    const encryptedId = this.encryptPii(idCardNumber);
    const encryptedName =
      extraction.firstName && extraction.lastName
        ? this.encryptPii(`${extraction.firstName} ${extraction.lastName}`)
        : null;
    const encryptedThaiName = extraction.thaiName ? this.encryptPii(extraction.thaiName) : null;

    // 5. AWS Liveness Session Initialization
    const livenessSessionId = await this.faceProvider.createLivenessSession();

    // 6. Threshold Branching (Manual Review)
    const isLowConfidence = !idCardNumber || idCardNumber.length < 13;
    const reviewNote = isLowConfidence ? 'OCR failed to extract complete ID number' : null;

    // 7. Upsert Data
    await this.prisma.$transaction(async (tx) => {
      await tx.kYCData.upsert({
        where: { userId },
        update: {
          idCardNumberEncrypted: encryptedId,
          idCardName: encryptedName,
          thaiNameEncrypted: encryptedThaiName,
          prefix: extraction.prefix,
          idCardToken,
          idCardImageUrl: idCardUrl,
          idCardImageSha256: idCardHash,
          livenessSessionId,
          idCardIssueDate: extraction.idCardIssueDate
            ? this.parseDate(extraction.idCardIssueDate)
            : null,
          idCardExpiryDate: extraction.idCardExpiryDate
            ? this.parseDate(extraction.idCardExpiryDate)
            : null,
          religion: extraction.religion,
          reviewNote,
          ocrConfidence: isLowConfidence ? 0.5 : 0.95,
        },
        create: {
          userId,
          verificationStatus: 'PENDING',
          idCardNumberEncrypted: encryptedId,
          idCardName: encryptedName,
          thaiNameEncrypted: encryptedThaiName,
          prefix: extraction.prefix,
          idCardToken,
          idCardImageUrl: idCardUrl,
          idCardImageSha256: idCardHash,
          livenessSessionId,
          idCardIssueDate: extraction.idCardIssueDate
            ? this.parseDate(extraction.idCardIssueDate)
            : null,
          idCardExpiryDate: extraction.idCardExpiryDate
            ? this.parseDate(extraction.idCardExpiryDate)
            : null,
          religion: extraction.religion,
          reviewNote,
          ocrConfidence: isLowConfidence ? 0.5 : 0.95,
        },
      });
    });

    return {
      extractedData: {
        idCardNumber: idCardNumber,
        firstName: extraction.firstName,
        lastName: extraction.lastName,
        thaiName: extraction.thaiName,
        prefix: extraction.prefix,
        dateOfBirth: extraction.dateOfBirth,
        idCardIssueDate: extraction.idCardIssueDate,
        idCardExpiryDate: extraction.idCardExpiryDate,
        religion: extraction.religion,
      },
      livenessSessionId,
    };
  }

  /**
   * Phase 2: Upload Selfie and verify Identity
   */
  async submitSelfie(userId: string, selfieImage: Buffer) {
    const kyc = await this.prisma.kYCData.findUnique({
      where: { userId },
    });

    if (!kyc || !kyc.livenessSessionId || !kyc.idCardImageUrl) {
      throw new BadRequestException('ID Card must be uploaded before selfie');
    }

    const selfieHash = this.hashBuffer(selfieImage);
    const selfieKey = `kyc/${userId}/selfie.jpg`;

    // 1. Upload Selfie
    const selfieUrl = await this.storageProvider.uploadFile(selfieKey, selfieImage, 'image/jpeg');

    // 2. Verify Liveness Session from AWS
    const liveness = await this.faceProvider.getLivenessResult(kyc.livenessSessionId);
    if (!liveness.isLive) {
      throw new UnauthorizedException('Face Liveness check failed. Please retry.');
    }

    // 3. Face Comparison
    const idCardBuffer = await this.storageProvider.downloadFile(kyc.idCardImageUrl);
    const comparison = await this.faceProvider.compareFaces(selfieImage, idCardBuffer);

    const isMatch = comparison.isMatch && comparison.score >= 90;

    // 4. Finalize KYC
    await this.prisma.$transaction(async (tx) => {
      await tx.kYCData.update({
        where: { userId },
        data: {
          selfieImageUrl: selfieUrl,
          selfieImageSha256: selfieHash,
          faceMatchScore: comparison.score,
          verificationStatus: isMatch ? 'APPROVED' : 'REJECTED',
          verifiedAt: new Date(),
        },
      });
    });

    return {
      isMatch,
      verificationStatus: isMatch ? 'APPROVED' : 'REJECTED',
    };
  }

  private parseDate(dateStr: string): Date | null {
    // Expected format: DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    const d = new Date(parseInt(year), this.mapMonth(month), parseInt(day));
    return isNaN(d.getTime()) ? null : d;
  }

  private mapMonth(monthStr: string): number {
    const thaiMonths = [
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ];
    const engMonths = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    let idx = thaiMonths.findIndex((m) => monthStr.includes(m));
    if (idx === -1)
      idx = engMonths.findIndex((m) => monthStr.toLowerCase().startsWith(m.toLowerCase()));

    return idx === -1 ? 0 : idx;
  }

  private encryptPii(data: string): string {
    const encryptionKey = this.configService.get<string>('PII_ENCRYPTION_KEY');
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

  private hashBuffer(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private hashString(str: string): string {
    return createHash('sha256').update(str, 'utf8').digest('hex');
  }
}

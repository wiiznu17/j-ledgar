import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { FinanceService } from '../integration/finance.service';
import { createHash, randomBytes, createCipheriv, randomUUID } from 'crypto';

@Injectable()
export class KycService {
  private readonly OCR_THRESHOLD = 0.85;
  private readonly logger = new Logger(KycService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly financeService: FinanceService,
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
    const document = await this.prisma.kYCDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new BadRequestException('Document not found');
    }

    const updated = await this.prisma.kYCDocument.update({
      where: { id: documentId },
      data: { status: 'APPROVED' },
    });

    // Check if this is the second approved document (wallet activation trigger)
    const documents = await this.prisma.kYCDocument.findMany({
      where: { userId: document.userId },
    });

    const approvedCount = documents.filter((d) => d.status === 'APPROVED').length;

    // Activate wallet when 2 documents are approved
    if (approvedCount >= 2) {
      try {
        const wallet = await this.financeService.activateWallet(document.userId);
        this.logger.log(`Wallet activated for user ${document.userId}: ${wallet.walletId}`);
      } catch (error) {
        this.logger.error(`Failed to activate wallet for user ${document.userId}`, error);
        // Don't throw - wallet activation can be retried manually
      }
    }

    return updated;
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
    const documents = await this.prisma.kYCDocument.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });

    // Get user emails separately (no FK relation)
    const userIds = [...new Set(documents.map((d) => d.userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return documents.map((doc) => ({
      ...doc,
      user: userMap.get(doc.userId) || null,
    }));
  }

  async getKYCHistory(userId: string) {
    return this.prisma.kYCDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async uploadIdCard(userId: string, idCardImage: Buffer) {
    const idCardHash = this.hashBuffer(idCardImage);
    const idCardKey = `kyc/${userId}/id-card.jpg`;

    // TODO: Upload to Storage (implement storage provider)
    const idCardUrl = `https://storage.example.com/${idCardKey}`;

    // TODO: Perform OCR (implement OCR provider)
    // mock
    const extraction = {
      idCardNumber: '1234567890123',
      firstNameEn: 'John',
      lastNameEn: 'Doe',
      prefixEn: 'Mr.',
      firstNameTh: 'สมชาย',
      lastNameTh: 'เข็มกลัด',
      prefixTh: 'นาย',
      thaiName: 'นายสมชาย เข็มกลัด',
      dateOfBirth: '01/01/1990',
      idCardIssueDate: '01/01/2010',
      idCardExpiryDate: '01/01/2030',
      religion: 'พุทธ',
      address: '123/45 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310',
    };

    const idCardNumber = extraction.idCardNumber;

    if (!idCardNumber) {
      throw new BadRequestException('Failed to extract ID card number');
    }

    // Identity Deduplication (SHA-256 of Raw Data)
    const idCardToken = this.hashString(idCardNumber);
    const existingKyc = await this.prisma.kYCData.findUnique({
      where: { idCardToken },
    });

    if (existingKyc && existingKyc.userId !== userId) {
      throw new ConflictException('This ID card is already registered with another account');
    }

    // Encryption of PII
    const encryptedId = this.encryptPii(idCardNumber);
    const encryptedName =
      extraction.firstNameEn && extraction.lastNameEn
        ? this.encryptPii(`${extraction.firstNameEn} ${extraction.lastNameEn}`)
        : null;
    const encryptedThaiName = extraction.thaiName ? this.encryptPii(extraction.thaiName) : null;

    // TODO: AWS Liveness Session Initialization (implement face provider)
    const livenessSessionId = randomUUID();

    // Threshold Branching (Manual Review)
    const isLowConfidence = !idCardNumber || idCardNumber.length < 13;
    const reviewNote = isLowConfidence ? 'OCR failed to extract complete ID number' : null;

    // Upsert Data
    await this.prisma.$transaction(async (tx) => {
      await tx.kYCData.upsert({
        where: { userId },
        update: {
          idCardNumberEncrypted: encryptedId,
          idCardName: extraction.thaiName,
          firstNameTh: extraction.firstNameTh,
          lastNameTh: extraction.lastNameTh,
          firstNameEn: extraction.firstNameEn,
          lastNameEn: extraction.lastNameEn,
          dateOfBirth: extraction.dateOfBirth ? this.parseDate(extraction.dateOfBirth) : null,
          thaiNameEncrypted: encryptedThaiName,
          prefix: extraction.prefixTh,
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
          idCardName: extraction.thaiName,
          firstNameTh: extraction.firstNameTh,
          lastNameTh: extraction.lastNameTh,
          firstNameEn: extraction.firstNameEn,
          lastNameEn: extraction.lastNameEn,
          dateOfBirth: extraction.dateOfBirth ? this.parseDate(extraction.dateOfBirth) : null,
          thaiNameEncrypted: encryptedThaiName,
          prefix: extraction.prefixTh,
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
    console.log("data from OCR = ", extraction)
    return {
      extractedData: {
        idCardNumber: idCardNumber,
        firstNameTh: extraction.firstNameTh,
        lastNameTh: extraction.lastNameTh,
        prefixTh: extraction.prefixTh,
        firstNameEn: extraction.firstNameEn,
        lastNameEn: extraction.lastNameEn,
        prefixEn: extraction.prefixEn,
        thaiName: extraction.thaiName,
        dateOfBirth: extraction.dateOfBirth,
        idCardIssueDate: extraction.idCardIssueDate,
        idCardExpiryDate: extraction.idCardExpiryDate,
        religion: extraction.religion,
        address: extraction.address,
      },
      livenessSessionId,
    };
  }

  async submitSelfie(userId: string, selfieImage: Buffer) {
    const kyc = await this.prisma.kYCData.findUnique({
      where: { userId },
    });

    if (!kyc || !kyc.livenessSessionId || !kyc.idCardImageUrl) {
      throw new BadRequestException('ID Card must be uploaded before selfie');
    }

    const selfieHash = this.hashBuffer(selfieImage);
    const selfieKey = `kyc/${userId}/selfie.jpg`;

    // TODO: Upload Selfie to storage
    const selfieUrl = `https://storage.example.com/${selfieKey}`;

    // TODO: Verify Liveness Session from AWS
    const liveness = { isLive: true };

    if (!liveness.isLive) {
      throw new UnauthorizedException('Face Liveness check failed. Please retry.');
    }

    // TODO: Face Comparison
    const comparison = { isMatch: true, score: 95 };

    const isMatch = comparison.isMatch && comparison.score >= 90;

    // Finalize KYC
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

  // ==================== Simple KYC Mode (For Testing) ====================

  async uploadIdCardSimple(userId: string, idCardImage: Buffer) {
    this.logger.log(`[KYC] STEP 5: Uploading ID card for user ${userId}`);
    this.logger.log(`[KYC] Image buffer size: ${idCardImage ? idCardImage.length : 'null'} bytes`);

    const idCardHash = this.hashBuffer(idCardImage);
    const idCardKey = `kyc/${userId}/id-card.jpg`;

    // TODO: Upload to Storage (implement storage provider)
    const idCardUrl = `https://storage.example.com/${idCardKey}`;

    // Mock extraction for simple mode
    const extraction = {
      idCardNumber: '1234567890123',
      firstNameTh: 'สมชาย',
      lastNameTh: 'เข็มกลัด',
      prefixTh: 'นาย',
      firstNameEn: 'John',
      lastNameEn: 'Doe',
      prefixEn: 'Mr.',
      thaiName: 'นายสมชาย เข็มกลัด',
      dateOfBirth: '01/01/1990',
      idCardIssueDate: '01/01/2010',
      idCardExpiryDate: '01/01/2030',
      religion: 'พุทธ',
      address: '123/45 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310',
    };
    console.log("data from simple mode = ", extraction)
    const idCardNumber = extraction.idCardNumber;
    const idCardToken = this.hashString(idCardNumber);
    const encryptedId = this.encryptPii(idCardNumber);
    const encryptedThaiName = this.encryptPii(extraction.thaiName);
    
    const livenessSessionId = randomUUID();
    this.logger.log(`[KYC] Generated livenessSessionId: ${livenessSessionId}`);

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.kYCData.upsert({
          where: { userId },
          update: {
            idCardImageUrl: idCardUrl,
            idCardImageSha256: idCardHash,
            idCardNumberEncrypted: encryptedId,
            idCardName: extraction.thaiName,
            firstNameTh: extraction.firstNameTh,
            lastNameTh: extraction.lastNameTh,
            firstNameEn: extraction.firstNameEn,
            lastNameEn: extraction.lastNameEn,
            prefix: extraction.prefixTh,
            dateOfBirth: this.parseDate(extraction.dateOfBirth),
            thaiNameEncrypted: encryptedThaiName,
            registeredAddress: extraction.address,
            religion: extraction.religion,
            idCardToken,
            livenessSessionId,
            verificationStatus: 'PENDING',
            ocrConfidence: 0.95,
          },
          create: {
            userId,
            verificationStatus: 'PENDING',
            idCardImageUrl: idCardUrl,
            idCardImageSha256: idCardHash,
            idCardNumberEncrypted: encryptedId,
            idCardName: extraction.thaiName,
            firstNameTh: extraction.firstNameTh,
            lastNameTh: extraction.lastNameTh,
            firstNameEn: extraction.firstNameEn,
            lastNameEn: extraction.lastNameEn,
            prefix: extraction.prefixTh,
            dateOfBirth: this.parseDate(extraction.dateOfBirth),
            thaiNameEncrypted: encryptedThaiName,
            registeredAddress: extraction.address,
            religion: extraction.religion,
            idCardToken,
            livenessSessionId,
            ocrConfidence: 0.95,
          },
        });
      });
      this.logger.log(`[KYC] KYC data upserted for user ${userId} with encrypted fields`);
    } catch (error) {
      this.logger.error(`[KYC] Failed to upsert KYC data for user ${userId}`, error);
      throw error;
    }

    // Update user registration state
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { registrationState: 'ID_CARD_UPLOADED' },
      });
      this.logger.log(`[KYC] User state updated to ID_CARD_UPLOADED for user ${userId}`);
    } catch (error) {
      this.logger.error(`[KYC] Failed to update user state for user ${userId}`, error);
      throw error;
    }

    this.logger.log(
      `[KYC] STEP 5 Complete: ID card uploaded for user ${userId}, state: ID_CARD_UPLOADED`,
    );

    return {
      extractedData: {
        idCardNumber: idCardNumber,
        firstNameTh: extraction.firstNameTh,
        lastNameTh: extraction.lastNameTh,
        prefixTh: extraction.prefixTh,
        firstNameEn: extraction.firstNameEn,
        lastNameEn: extraction.lastNameEn,
        prefixEn: extraction.prefixEn,
        thaiName: extraction.thaiName,
        dateOfBirth: extraction.dateOfBirth,
        idCardIssueDate: extraction.idCardIssueDate,
        idCardExpiryDate: extraction.idCardExpiryDate,
        religion: extraction.religion,
        address: extraction.address,
      },
      livenessSessionId,
    };
  }

  async confirmOcrData(userId: string, dto: any) {
    this.logger.log(`[KYC] STEP 5.5: Confirming OCR data for user ${userId}`);
    
    // Encrypt sensitive fields
    const encryptedId = dto.idNumber ? this.encryptPii(dto.idNumber) : null;
    const thaiName = `${dto.prefixTh || ''}${dto.firstNameTh || ''} ${dto.lastNameTh || ''}`.trim();
    const encryptedThaiName = thaiName ? this.encryptPii(thaiName) : null;
    const idCardToken = dto.idNumber ? this.hashString(dto.idNumber) : null;

    try {
      const updated = await this.prisma.kYCData.update({
        where: { userId },
        data: {
          idCardNumberEncrypted: encryptedId,
          idCardName: thaiName,
          firstNameTh: dto.firstNameTh,
          lastNameTh: dto.lastNameTh,
          firstNameEn: dto.firstNameEn,
          lastNameEn: dto.lastNameEn,
          prefix: dto.prefixTh,
          dateOfBirth: dto.dateOfBirth ? this.parseDate(dto.dateOfBirth) : null,
          idCardIssueDate: dto.issueDate ? this.parseDate(dto.issueDate) : null,
          idCardExpiryDate: dto.expiryDate ? this.parseDate(dto.expiryDate) : null,
          thaiNameEncrypted: encryptedThaiName,
          registeredAddress: dto.registeredAddress,
          religion: dto.religion,
          ...(idCardToken && { idCardToken }),
        },
      });
      this.logger.log(`[KYC] OCR data confirmed and saved for user ${userId}`);
      return updated;
    } catch (error) {
      this.logger.error(`[KYC] Failed to save confirmed OCR data for user ${userId}`, error);
      throw error;
    }
  }

  async submitSelfieSimple(userId: string, selfieImage: Buffer) {
    this.logger.log(`[KYC] STEP 6: Submitting selfie for user ${userId}`);
    this.logger.log(`[KYC] Selfie buffer size: ${selfieImage ? selfieImage.length : 'null'} bytes`);

    const kyc = await this.prisma.kYCData.findUnique({
      where: { userId },
    });

    this.logger.log(
      `[KYC] Found KYC data: ${!!kyc}, has livenessSessionId: ${!!kyc?.livenessSessionId}`,
    );

    if (!kyc || !kyc.livenessSessionId) {
      this.logger.error(`[KYC] ID Card must be uploaded before selfie for user ${userId}`);
      throw new BadRequestException('ID Card must be uploaded before selfie');
    }

    const selfieHash = this.hashBuffer(selfieImage);
    const selfieKey = `kyc/${userId}/selfie.jpg`;

    // TODO: Upload Selfie to storage
    const selfieUrl = `https://storage.example.com/${selfieKey}`;

    // Simple mode: Skip face verification, just save the image
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.kYCData.update({
          where: { userId },
          data: {
            selfieImageUrl: selfieUrl,
            selfieImageSha256: selfieHash,
            verificationStatus: 'APPROVED', // Auto-approve in simple mode
            verifiedAt: new Date(),
          },
        });
      });
      this.logger.log(`[KYC] KYC data updated with selfie for user ${userId}`);
    } catch (error) {
      this.logger.error(`[KYC] Failed to update KYC data with selfie for user ${userId}`, error);
      throw error;
    }

    // Update user registration state
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { registrationState: 'KYC_VERIFIED' },
      });
      this.logger.log(`[KYC] User state updated to KYC_VERIFIED for user ${userId}`);
    } catch (error) {
      this.logger.error(`[KYC] Failed to update user state for user ${userId}`, error);
      throw error;
    }

    this.logger.log(
      `[KYC] STEP 6 Complete: Selfie submitted for user ${userId}, state: KYC_VERIFIED`,
    );

    return {
      isMatch: true,
      verificationStatus: 'APPROVED',
    };
  }

  private parseDate(dateStr: string): Date | null {
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

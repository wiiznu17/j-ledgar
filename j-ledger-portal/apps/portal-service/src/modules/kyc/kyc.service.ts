import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { FinanceService } from '../integration/finance.service';
import { IdentityService } from '../identity/identity.service';
import { KafkaProducerService } from '../notification/kafka-producer.service';
import { S3Service } from './services/s3.service';
import { GoogleVisionService } from './services/ocr.service';
import { AwsRekognitionService } from './services/face.service';
import {
  createHash,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  randomUUID,
} from 'crypto';
import { ConfirmOcrDto } from './dto/kyc.dto';
import {
  KafkaTopic,
  NotificationEventType,
  UserStatus,
  RegistrationState,
  KYCVerificationStatus,
} from '@repo/dto';

@Injectable()
export class KycService {
  private readonly OCR_THRESHOLD = 0.85;
  private readonly logger = new Logger(KycService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly financeService: FinanceService,
    private readonly identityService: IdentityService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly s3Service: S3Service,
    private readonly ocrService: GoogleVisionService,
    private readonly faceService: AwsRekognitionService,
  ) {}

  async getKYCStatus(userId: string) {
    const documents = await this.prisma.kYCDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const approvedCount = documents.filter(
      (d) =>
        (d.status as KYCVerificationStatus) === KYCVerificationStatus.APPROVED,
    ).length;
    const pendingCount = documents.filter(
      (d) =>
        (d.status as KYCVerificationStatus) === KYCVerificationStatus.PENDING,
    ).length;
    const rejectedCount = documents.filter(
      (d) =>
        (d.status as KYCVerificationStatus) === KYCVerificationStatus.REJECTED,
    ).length;

    return {
      userId,
      status:
        approvedCount >= 2
          ? KYCVerificationStatus.APPROVED
          : pendingCount > 0
            ? KYCVerificationStatus.PENDING
            : KYCVerificationStatus.NOT_STARTED,
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
      data: { status: KYCVerificationStatus.APPROVED },
    });

    // Check if this is the second approved document (wallet activation trigger)
    const documents = await this.prisma.kYCDocument.findMany({
      where: { userId: document.userId },
    });

    const approvedCount = documents.filter(
      (d) =>
        (d.status as KYCVerificationStatus) === KYCVerificationStatus.APPROVED,
    ).length;

    // Activate wallet when 2 documents are approved
    if (approvedCount >= 2) {
      try {
        const wallet = await this.financeService.activateWallet(
          document.userId,
        );
        this.logger.log(
          `Wallet activated for user ${document.userId}: ${wallet.walletId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to activate wallet for user ${document.userId}`,
          error,
        );
        // Don't throw - wallet activation can be retried manually
      }
    }

    // Emit to Kafka for notification-worker
    try {
      await this.kafkaProducer.emit(KafkaTopic.KYC_EVENTS, {
        userId: document.userId,
        documentId,
        status: KYCVerificationStatus.APPROVED,
        timestamp: new Date().toISOString(),
        referenceId: documentId,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to emit KYC_EVENTS (APPROVED) to Kafka for user ${document.userId}: ${error.message}`,
      );
    }

    return updated;
  }

  async rejectDocument(documentId: string, reason: string) {
    const updated = await this.prisma.kYCDocument.update({
      where: { id: documentId },
      data: {
        status: KYCVerificationStatus.REJECTED,
        metadata: { reason },
      },
    });

    // Emit to Kafka for notification-worker
    try {
      await this.kafkaProducer.emit(KafkaTopic.KYC_EVENTS, {
        userId: updated.userId,
        documentId,
        status: KYCVerificationStatus.REJECTED,
        reason,
        timestamp: new Date().toISOString(),
        referenceId: documentId,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to emit KYC_EVENTS (REJECTED) to Kafka for user ${updated.userId}: ${error.message}`,
      );
    }

    return updated;
  }

  async approveKyc(userId: string) {
    // Check current status
    const current = await this.prisma.kYCData.findUnique({ where: { userId } });
    if (
      (current?.verificationStatus as KYCVerificationStatus) ===
      KYCVerificationStatus.APPROVED
    ) {
      throw new Error('KYC is already approved');
    }

    const kyc = await this.prisma.kYCData.update({
      where: { userId },
      data: {
        verificationStatus: KYCVerificationStatus.APPROVED,
        verifiedAt: new Date(),
      },
    });

    // Activate wallet on KYC approval
    try {
      await this.financeService.activateWallet(userId);
      this.logger.log(`Wallet activated for user ${userId} after KYC approval`);
    } catch (err) {
      this.logger.error(`Failed to activate wallet for user ${userId}`, err);
    }

    // Update main user status and registration state
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { registrationState: true },
    });

    const updateData: {
      status: UserStatus;
      registrationState?: RegistrationState;
    } = {
      status: UserStatus.ACTIVE,
    };

    // List of states that are "before" KYC_VERIFIED
    const statesBeforeKycVerified = [
      RegistrationState.PENDING,
      RegistrationState.PENDING_OTP,
      RegistrationState.INITIATED,
      RegistrationState.OTP_VERIFIED,
      RegistrationState.TC_ACCEPTED,
      RegistrationState.ID_CARD_UPLOADED,
      RegistrationState.ID_CARD_CONFIRMED,
    ];

    // Only set to KYC_VERIFIED if the user hasn't progressed further
    if (
      user &&
      statesBeforeKycVerified.includes(
        user.registrationState as RegistrationState,
      )
    ) {
      updateData.registrationState = RegistrationState.KYC_VERIFIED;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Emit event for notification
    try {
      await this.kafkaProducer.emit(KafkaTopic.KYC_EVENTS, {
        userId,
        status: NotificationEventType.KYC_APPROVED,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.warn(
        `Failed to emit KYC_EVENTS (KYC_APPROVED) to Kafka for user ${userId}: ${error.message}`,
      );
    }

    await this.identityService.logSecurityEvent(
      userId,
      NotificationEventType.KYC_APPROVED,
    );

    return kyc;
  }

  async rejectKyc(userId: string, reason: string) {
    // Check current status
    const current = await this.prisma.kYCData.findUnique({ where: { userId } });
    if (
      (current?.verificationStatus as KYCVerificationStatus) ===
      KYCVerificationStatus.APPROVED
    ) {
      throw new Error('Cannot reject an already approved KYC');
    }
    if (
      (current?.verificationStatus as KYCVerificationStatus) ===
      KYCVerificationStatus.REJECTED
    ) {
      throw new Error('KYC is already rejected');
    }

    const kyc = await this.prisma.kYCData.update({
      where: { userId },
      data: {
        verificationStatus: KYCVerificationStatus.REJECTED,
        reviewNote: reason,
      },
    });

    // Update main user status to REJECTED
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.REJECTED as UserStatus },
    });

    // Emit event for notification
    try {
      await this.kafkaProducer.emit(KafkaTopic.KYC_EVENTS, {
        userId,
        status: NotificationEventType.KYC_REJECTED,
        reason,
        timestamp: new Date().toISOString(),
        metadata: { reason },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to emit KYC_EVENTS (KYC_REJECTED) to Kafka for user ${userId}: ${error.message}`,
      );
    }

    await this.identityService.logSecurityEvent(
      userId,
      NotificationEventType.KYC_REJECTED,
      {
        reason,
      },
    );

    return kyc;
  }

  async retryKyc(userId: string) {
    // 1. Reset user status to PENDING_APPROVAL
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        registrationState: RegistrationState.TC_ACCEPTED, // Back to step before OCR
        status: UserStatus.REJECTED as UserStatus, // Keep as REJECTED as requested
      },
    });

    // 2. Reset KYC data status back to PENDING but keep images for reference if needed
    // (Or let them be overwritten by the next upload)
    await this.prisma.kYCData.update({
      where: { userId },
      data: {
        verificationStatus: KYCVerificationStatus.REJECTED, // Keep as REJECTED as requested
        reviewNote: null,
        verifiedAt: null,
      },
    });

    return { success: true };
  }

  async getKYCList(
    status: string = UserStatus.PENDING_APPROVAL,
    phoneNumber?: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 50,
  ) {
    this.logger.log(
      `[KYC] Fetching KYC list - status: ${status}, phone: ${phoneNumber}, dates: ${startDate} to ${endDate}`,
    );

    // 1. Build where clause for User
    const where: Record<string, any> = { status: status as UserStatus };

    if (phoneNumber) {
      where.phoneNumber = { contains: phoneNumber };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [total, usersWithStatus] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: { id: true, email: true, phoneNumber: true, status: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const userIds = usersWithStatus.map((u) => u.id);

    // 2. Query KYCData and documents for these users
    const [kycData, documents, stats] = await Promise.all([
      this.prisma.kYCData.findMany({
        where: { userId: { in: userIds } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.kYCDocument.findMany({
        where: { userId: { in: userIds } },
        orderBy: { createdAt: 'desc' },
      }),
      // Phase 3: Stats Summary
      this.getKYCStats(),
    ]);

    const userMap = new Map(usersWithStatus.map((u) => [u.id, u]));

    const items = kycData.map((k) => ({
      id: k.id,
      userId: k.userId,
      documentType: 'KYC_VERIFICATION',
      status: k.verificationStatus,
      createdAt: k.createdAt,
      user: userMap.get(k.userId) || null,
    }));

    return {
      items,
      stats,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getKYCStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, approvedToday, rejectedToday] = await Promise.all([
      this.prisma.user.count({
        where: { status: UserStatus.PENDING_APPROVAL },
      }),
      this.prisma.kYCData.count({
        where: {
          verificationStatus: KYCVerificationStatus.APPROVED,
          verifiedAt: { gte: today },
        },
      }),
      this.prisma.kYCData.count({
        where: {
          verificationStatus: KYCVerificationStatus.REJECTED,
          updatedAt: { gte: today },
        },
      }),
    ]);

    return { pending, approvedToday, rejectedToday };
  }

  async getPendingKYCList() {
    const list = await this.getKYCList(UserStatus.PENDING_APPROVAL);
    return list.items;
  }

  async getKYCHistory(userId: string) {
    return this.prisma.kYCDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getKYCDetails(userId: string) {
    const [kycData, documents, user, addresses, profileSetting] =
      await Promise.all([
        this.prisma.kYCData.findUnique({
          where: { userId },
          select: {
            idCardNumberEncrypted: true,
            firstNameTh: true,
            lastNameTh: true,
            firstNameEn: true,
            lastNameEn: true,
            prefix: true,
            prefixEn: true,
            dateOfBirth: true,
            idCardIssueDate: true,
            idCardExpiryDate: true,
            religion: true,
            idCardImageUrl: true,
            selfieImageUrl: true,
            faceMatchScore: true,
            ocrConfidence: true,
            verificationStatus: true,
            reviewNote: true,
            createdAt: true,
          },
        }),
        this.prisma.kYCDocument.findMany({
          where: { userId },
          select: {
            id: true,
            documentType: true,
            status: true,
            s3Url: true,
            createdAt: true,
          },
        }),
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, phoneNumber: true },
        }),
        this.prisma.address.findMany({
          where: { userId },
          select: {
            type: true,
            label: true,
            line1: true,
            subdistrict: true,
            district: true,
            province: true,
            postalCode: true,
          },
        }),
        this.prisma.userSetting.findUnique({
          where: { userId_key: { userId, key: 'profile' } },
        }),
      ]);

    // Parse profile if exists
    let profile = null;
    if (profileSetting) {
      try {
        profile = JSON.parse(profileSetting.value);
      } catch (e) {
        this.logger.error(`Failed to parse profile for user ${userId}`, e);
      }
    }

    // Generate signed URLs if images exist and decrypt PII
    if (kycData) {
      // Decrypt ID card number for admin review
      if (kycData.idCardNumberEncrypted) {
        try {
          kycData.idCardNumberEncrypted = this.decryptPii(
            kycData.idCardNumberEncrypted,
          );
        } catch (e) {
          this.logger.error(
            `Failed to decrypt ID card number for user ${userId}`,
            e,
          );
          kycData.idCardNumberEncrypted = 'DECRYPTION_FAILED';
        }
      }

      if (kycData.idCardImageUrl) {
        const key = `kyc/${userId}/id-card.jpg`;
        try {
          kycData.idCardImageUrl = await this.s3Service.getPresignedUrl(key);
        } catch (e) {}
      }
      if (kycData.selfieImageUrl) {
        const key = `kyc/${userId}/selfie.jpg`;
        try {
          kycData.selfieImageUrl = await this.s3Service.getPresignedUrl(key);
        } catch (e) {
          this.logger.error(
            `Failed to generate signed URL for selfie: ${userId}`,
            e,
          );
        }
      }
    }

    return {
      kycData,
      documents,
      user: {
        ...user,
        profile,
      },
      addresses,
      // Phase 2: Audit History (Manual Join with Staff)
      history: await (async () => {
        const logs = await this.prisma.auditLog.findMany({
          where: { resourceId: userId, resourceType: 'KYC_DOCUMENT' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        // Fetch staff names manually
        const staffIds = logs
          .map((l) => l.adminUserId)
          .filter(Boolean) as string[];
        const staff = await this.prisma.staff.findMany({
          where: { id: { in: staffIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        });

        const staffMap = new Map(staff.map((s) => [s.id, s]));

        return logs.map((log) => ({
          ...log,
          adminUser: log.adminUserId ? staffMap.get(log.adminUserId) : null,
        }));
      })(),
    };
  }

  async uploadIdCard(userId: string, idCardImage: Buffer) {
    await this.identityService.validateRegistrationState(userId, [
      RegistrationState.TC_ACCEPTED,
      RegistrationState.ID_CARD_UPLOADED,
    ]);
    const idCardHash = this.hashBuffer(idCardImage);
    const idCardKey = `kyc/${userId}/id-card.jpg`;

    // 1. Upload to S3
    const idCardUrl = await this.s3Service.uploadFile(
      idCardKey,
      idCardImage,
      'image/jpeg',
    );

    // 2. Perform OCR via Google Vision
    const ocrResult = await this.ocrService.extractIdCardData(idCardImage);

    // Fail early if OCR results are clearly invalid/empty
    if (!ocrResult || !ocrResult.idNumber) {
      this.logger.warn(
        `[KYC] OCR failed to extract ID number for user ${userId}`,
      );
      throw new BadRequestException(
        'Could not read ID card number. Please ensure the card is clear and try again.',
      );
    }

    const idCardNumber = ocrResult.idNumber;
    const extraction = ocrResult;

    // 3. Identity Deduplication (SHA-256 of Raw Data)
    const idCardToken = idCardNumber ? this.hashString(idCardNumber) : null;
    if (idCardToken) {
      const existingKyc = await this.prisma.kYCData.findUnique({
        where: { idCardToken },
      });

      if (existingKyc && existingKyc.userId !== userId) {
        throw new ConflictException(
          'This ID card is already registered with another account',
        );
      }
    }

    // 4. Initialize AWS Liveness Session
    const livenessSessionId = await this.faceService.createLivenessSession();

    // 5. Threshold Branching (Manual Review)
    const isLowConfidence = !idCardNumber || idCardNumber.length < 13;
    const reviewNote = isLowConfidence
      ? 'OCR failed to extract complete ID number'
      : null;

    // 6. Upsert Data
    await this.prisma.$transaction(async (tx) => {
      await tx.kYCData.upsert({
        where: { userId },
        update: {
          idCardNumberEncrypted: idCardNumber
            ? this.encryptPii(idCardNumber)
            : null,
          idCardToken,
          idCardImageUrl: idCardUrl,
          idCardImageSha256: idCardHash,
          livenessSessionId,
          reviewNote,
          ocrConfidence: isLowConfidence ? 0.5 : 0.95,
          verificationStatus: KYCVerificationStatus.PENDING,
        },
        create: {
          userId,
          verificationStatus: KYCVerificationStatus.PENDING,
          idCardNumberEncrypted: idCardNumber
            ? this.encryptPii(idCardNumber)
            : null,
          idCardToken,
          idCardImageUrl: idCardUrl,
          idCardImageSha256: idCardHash,
          livenessSessionId,
          reviewNote,
          ocrConfidence: isLowConfidence ? 0.5 : 0.95,
          prefix: extraction.prefixTh,
          firstNameTh: extraction.firstNameTh,
          lastNameTh: extraction.lastNameTh,
          prefixEn: extraction.prefixEn,
          firstNameEn: extraction.firstNameEn,
          lastNameEn: extraction.lastNameEn,
          dateOfBirth: this.parseDate(extraction.dateOfBirth),
          idCardIssueDate: this.parseDate(extraction.idCardIssueDate),
          idCardExpiryDate: this.parseDate(extraction.idCardExpiryDate),
          religion: extraction.religion,
        },
      });

      // Save raw address to PII for resumption if structured data isn't confirmed yet
      if (extraction.registeredAddress) {
        await tx.pII.upsert({
          where: { userId_field: { userId, field: 'raw_id_card_address' } },
          update: {
            encryptedData: this.encryptPii(extraction.registeredAddress),
          },
          create: {
            userId,
            field: 'raw_id_card_address',
            encryptedData: this.encryptPii(extraction.registeredAddress),
          },
        });
      }
    });

    // Update user registration state
    await this.prisma.user.update({
      where: { id: userId },
      data: { registrationState: RegistrationState.ID_CARD_UPLOADED },
    });

    return {
      extractedData: {
        idCardNumber: idCardNumber,
        ...extraction, // Spread names, dates, etc.
      },
      livenessSessionId,
    };
  }

  async submitSelfie(userId: string, selfieImage?: Buffer) {
    await this.identityService.validateRegistrationState(userId, [
      RegistrationState.ID_CARD_CONFIRMED,
      RegistrationState.KYC_VERIFIED,
    ]);
    const kyc = await this.prisma.kYCData.findUnique({
      where: { userId },
    });

    if (!kyc || !kyc.livenessSessionId || !kyc.idCardImageUrl) {
      throw new BadRequestException('ID Card must be uploaded before selfie');
    }

    // 1. Try to get Liveness Session Results if exists, otherwise fallback to manual comparison
    let livenessResults: any = null;
    try {
      livenessResults = await this.faceService.getLivenessResults(
        kyc.livenessSessionId,
      );
      this.logger.log(
        `Liveness check for user ${userId}: Status=${livenessResults.status}, Confidence=${livenessResults.confidence}`,
      );
    } catch (err) {
      this.logger.warn(
        `Liveness results not available for session ${kyc.livenessSessionId}, proceeding with manual face comparison.`,
      );
    }

    const minLivenessScore = this.configService.get(
      'KYC_MIN_LIVENESS_CONFIDENCE',
      90,
    );
    const isLive =
      livenessResults &&
      livenessResults.status === 'SUCCEEDED' &&
      (livenessResults.confidence || 0) >= minLivenessScore;

    // 2. Determine which image to use for Comparison
    let finalSelfieBuffer: Buffer;
    if (isLive && livenessResults?.referenceImage?.Bytes) {
      finalSelfieBuffer = Buffer.from(livenessResults.referenceImage.Bytes);
      this.logger.debug(
        `Using AWS Liveness Reference Image for user ${userId}`,
      );
    } else if (selfieImage) {
      finalSelfieBuffer = selfieImage;
      this.logger.debug(`Using manual selfie upload for user ${userId}`);
    } else {
      throw new BadRequestException(
        'Face verification data missing. Please capture your face correctly.',
      );
    }

    const selfieHash = this.hashBuffer(finalSelfieBuffer);
    const selfieKey = `kyc/${userId}/selfie.jpg`;

    // 3. Upload Selfie to S3
    const selfieUrl = await this.s3Service.uploadFile(
      selfieKey,
      finalSelfieBuffer,
      'image/jpeg',
    );

    // 4. Face Comparison (Real Comparison)
    // We use the ID card key from S3 and the new selfie buffer
    const idCardKey = `kyc/${userId}/id-card.jpg`;

    // AWS Rekognition can take bytes for both. Since we have selfie as buffer,
    // we just need the ID card buffer.
    // Optimization: In a real high-scale system, we'd use S3 objects directly in Rekognition
    // But for this flow, we'll download ID card buffer once to compare.

    this.logger.debug(`Performing real face comparison for user ${userId}`);

    let isMatch = false;
    let similarity = 0;

    try {
      // Fetch ID card image from S3
      const idCardBuffer = await this.s3Service.getFile(idCardKey);

      // Compare with the reference image (from liveness) or provided selfie
      const comparison = await this.faceService.compareFaces(
        idCardBuffer,
        finalSelfieBuffer,
      );

      const minSimilarity = this.configService.get(
        'KYC_MIN_SIMILARITY_SCORE',
        80,
      );
      isMatch = comparison.isMatch && comparison.similarity >= minSimilarity;
      similarity = comparison.similarity;

      this.logger.log(
        `Face match result for user ${userId}: isMatch=${isMatch}, similarity=${similarity}%`,
      );

      if (!isMatch) {
        throw new BadRequestException(
          `Face verification failed (Similarity: ${similarity}%). Please ensure your face is clearly visible and matches your ID card.`,
        );
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Face comparison failed for user ${userId}`, err);
      isMatch = false;
      throw new BadRequestException(
        'Face verification failed. Please try again with better lighting.',
      );
    }

    // Finalize KYC
    await this.prisma.$transaction(async (tx) => {
      await tx.kYCData.update({
        where: { userId },
        data: {
          selfieImageUrl: selfieUrl,
          selfieImageSha256: selfieHash,
          faceMatchScore: Math.round(similarity),
          verificationStatus: KYCVerificationStatus.PENDING,
          updatedAt: new Date(),
        },
      });

      // Update user registration state
      await tx.user.update({
        where: { id: userId },
        data: { registrationState: RegistrationState.KYC_VERIFIED },
      });
    });

    return {
      isMatch,
      verificationStatus: isMatch
        ? KYCVerificationStatus.APPROVED
        : KYCVerificationStatus.REJECTED,
    };
  }

  // ==================== Simple KYC Mode (For Testing) ====================

  async uploadIdCardSimple(userId: string, idCardImage: Buffer) {
    this.logger.log(`[KYC] STEP 5: Uploading ID card for user ${userId}`);
    this.logger.log(
      `[KYC] Image buffer size: ${idCardImage ? idCardImage.length : 'null'} bytes`,
    );

    const idCardHash = this.hashBuffer(idCardImage);
    const idCardKey = `kyc/${userId}/id-card.jpg`;

    // Upload to S3
    const idCardUrl = await this.s3Service.uploadFile(
      idCardKey,
      idCardImage,
      'image/jpeg',
    );

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
      address: {
        line1: '123/45 ถนนพระราม 9',
        subdistrict: 'ห้วยขวาง',
        district: 'ห้วยขวาง',
        province: 'กรุงเทพฯ',
        postalCode: '10310',
      },
    };
    console.log('data from simple mode = ', extraction);
    const idCardNumber = extraction.idCardNumber;
    // In mock/simple mode, we use userId in the token to allow multiple users to test with the same mock ID
    const idCardToken = this.hashString(idCardNumber + userId);
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

            religion: extraction.religion,
            idCardToken,
            livenessSessionId,
            verificationStatus: KYCVerificationStatus.PENDING,
            ocrConfidence: 0.95,
          },
          create: {
            userId,
            verificationStatus: KYCVerificationStatus.PENDING,
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

            religion: extraction.religion,
            idCardToken,
            livenessSessionId,
            ocrConfidence: 0.95,
          },
        });
      });
      this.logger.log(
        `[KYC] KYC data upserted for user ${userId} with encrypted fields`,
      );
    } catch (error) {
      this.logger.error(
        `[KYC] Failed to upsert KYC data for user ${userId}`,
        error,
      );
      throw error;
    }

    // Update user registration state
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { registrationState: RegistrationState.ID_CARD_UPLOADED },
      });
      this.logger.log(
        `[KYC] User state updated to ID_CARD_UPLOADED for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `[KYC] Failed to update user state for user ${userId}`,
        error,
      );
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
        registeredAddress: extraction.address,
      },
      livenessSessionId,
    };
  }

  async confirmOcrData(userId: string, dto: any) {
    await this.identityService.validateRegistrationState(userId, [
      RegistrationState.ID_CARD_UPLOADED,
      RegistrationState.ID_CARD_CONFIRMED,
    ]);
    this.logger.log(`[KYC] STEP 5.5: Confirming OCR data for user ${userId}`);

    // Encrypt sensitive fields
    const encryptedId = dto.idNumber ? this.encryptPii(dto.idNumber) : null;
    const thaiName =
      `${dto.prefixTh || ''}${dto.firstNameTh || ''} ${dto.lastNameTh || ''}`.trim();
    const encryptedThaiName = thaiName ? this.encryptPii(thaiName) : null;
    // In mock/simple mode, we use userId in the token to allow multiple users to test with the same mock ID
    // TODO: For production, remove + userId to enforce global deduplication of ID cards
    const idCardToken = dto.idNumber
      ? this.hashString(dto.idNumber + userId)
      : null;

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
          prefixEn: dto.prefixEn,
          dateOfBirth: dto.dateOfBirth ? this.parseDate(dto.dateOfBirth) : null,
          idCardIssueDate: dto.issueDate ? this.parseDate(dto.issueDate) : null,
          idCardExpiryDate: dto.expiryDate
            ? this.parseDate(dto.expiryDate)
            : null,
          thaiNameEncrypted: encryptedThaiName,
          religion: dto.religion,
          ...(idCardToken && { idCardToken }),
        },
      });

      // 4. Update identity.addresses table via IdentityService
      if (dto.registeredAddress) {
        await this.identityService.updateAddress(
          userId,
          'REGISTERED',
          dto.registeredAddress,
          'ID_CARD_OCR',
        );
      }

      // Update user registration state to ID_CARD_CONFIRMED
      await this.prisma.user.update({
        where: { id: userId },
        data: { registrationState: RegistrationState.ID_CARD_CONFIRMED },
      });

      this.logger.log(
        `[KYC] OCR data confirmed and state updated to ID_CARD_CONFIRMED for user ${userId}`,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(
        `[KYC] Failed to save confirmed OCR data for user ${userId}`,
        error,
      );
      throw error;
    }
  }

  async submitSelfieSimple(userId: string, selfieImage: Buffer) {
    this.logger.log(`[KYC] STEP 6: Submitting selfie for user ${userId}`);
    this.logger.log(
      `[KYC] Selfie buffer size: ${selfieImage ? selfieImage.length : 'null'} bytes`,
    );

    const kyc = await this.prisma.kYCData.findUnique({
      where: { userId },
    });

    this.logger.log(
      `[KYC] Found KYC data: ${!!kyc}, has livenessSessionId: ${!!kyc?.livenessSessionId}`,
    );

    if (!kyc || !kyc.livenessSessionId) {
      this.logger.error(
        `[KYC] ID Card must be uploaded before selfie for user ${userId}`,
      );
      throw new BadRequestException('ID Card must be uploaded before selfie');
    }

    const selfieHash = this.hashBuffer(selfieImage);
    const selfieKey = `kyc/${userId}/selfie.jpg`;

    // Upload Selfie to S3
    const selfieUrl = await this.s3Service.uploadFile(
      selfieKey,
      selfieImage,
      'image/jpeg',
    );

    // Simple mode: Skip face verification, just save the image
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.kYCData.update({
          where: { userId },
          data: {
            selfieImageUrl: selfieUrl,
            selfieImageSha256: selfieHash,
            verificationStatus: KYCVerificationStatus.PENDING, // Wait for admin review even in simple mode
            verifiedAt: null,
          },
        });
      });
      this.logger.log(`[KYC] KYC data updated with selfie for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `[KYC] Failed to update KYC data with selfie for user ${userId}`,
        error,
      );
      throw error;
    }

    // Update user registration state
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { registrationState: RegistrationState.KYC_VERIFIED },
      });
      this.logger.log(
        `[KYC] User state updated to KYC_VERIFIED for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `[KYC] Failed to update user state for user ${userId}`,
        error,
      );
      throw error;
    }

    this.logger.log(
      `[KYC] STEP 6 Complete: Selfie submitted for user ${userId}, state: KYC_VERIFIED`,
    );

    return {
      isMatch: true,
      verificationStatus: KYCVerificationStatus.PENDING,
    };
  }

  private parseDate(dateStr: string | null): Date | null {
    if (!dateStr) return null;

    // Split by /, space, or dot
    const parts = dateStr.split(/[\/\s.]+/).filter(Boolean);
    if (parts.length < 3) return null;

    const day = parseInt(parts[0]);
    const month = parts[1];
    let year = parseInt(parts[2]);

    // Handle Buddhist Era (BE) - Thai years are usually > 2400
    if (year > 2400) {
      year -= 543;
    }

    const d = new Date(year, this.mapMonth(month), day);
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
      idx = engMonths.findIndex((m) =>
        monthStr.toLowerCase().startsWith(m.toLowerCase()),
      );

    return idx === -1 ? 0 : idx;
  }

  private encryptPii(data: string): string {
    const encryptionKey = this.configService.get<string>('PII_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new InternalServerErrorException(
        'System missing PII encryption capabilities',
      );
    }
    const iv = randomBytes(12);
    const key = Buffer.from(encryptionKey, 'hex');
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private decryptPii(encryptedData: string): string {
    const encryptionKey = this.configService.get<string>('PII_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new InternalServerErrorException(
        'System missing PII decryption capabilities',
      );
    }

    try {
      const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':');
      if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const key = Buffer.from(encryptionKey, 'hex');
      const decipher = createDecipheriv('aes-256-gcm', key, iv);

      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`);
      throw new Error('Could not decrypt PII data');
    }
  }

  private hashBuffer(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private hashString(str: string): string {
    return createHash('sha256').update(str, 'utf8').digest('hex');
  }
}

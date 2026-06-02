import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { FinanceService } from '../../../core/finance/finance.service';
import { IdentityService } from '../../identity/identity.service';
import { KafkaProducerService } from '../../notification/kafka-producer.service';
import { S3Service } from './s3.service';
import { KycCryptoService } from './kyc-crypto.service';
import {
  KafkaTopic,
  NotificationEventType,
  UserStatus,
  RegistrationState,
  KYCVerificationStatus,
} from '@repo/dto';
import { PaginationUtility } from '../../../common/utils/pagination.util';

@Injectable()
export class KycAdminService {
  private readonly logger = new Logger(KycAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
    private readonly identityService: IdentityService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly s3Service: S3Service,
    private readonly cryptoService: KycCryptoService,
  ) {}

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

    // Ensure wallet exists and is active on KYC approval
    try {
      const userFull = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      let walletId = userFull?.ledgerAccountId;

      if (!walletId) {
        this.logger.log(
          `[KYC] Creating new wallet for user ${userId} on approval`,
        );
        const wallet = await this.financeService.createWallet(userId, 'THB');
        walletId = wallet.walletId;
        // Link wallet to user in portal DB
        await this.prisma.user.update({
          where: { id: userId },
          data: { ledgerAccountId: walletId },
        });
      } else {
        // Just activate if it somehow already exists
        await this.financeService.activateWallet(userId);
      }

      this.logger.log(`Wallet ready for user ${userId} after KYC approval`);

      // Also create a default ledger account for reward points and accounting
      try {
        const accountName = `Wallet: ${userFull.phoneNumber}`;
        await this.financeService.createAccount(userId, accountName);
        this.logger.log(
          `Ledger account '${accountName}' created for user ${userId} after KYC approval`,
        );
      } catch (accErr) {
        this.logger.warn(
          `Failed to create ledger account for user ${userId}: ${accErr.message}`,
        );
      }
    } catch (err) {
      this.logger.error(`Failed to initialize wallet for user ${userId}`, err);
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

    const { page: safePage, limit: safeLimit, skip, take } = PaginationUtility.getParams({ page, limit });

    // 1. Build where clause for User
    const where: Record<string, any> = {};
    if (status !== 'ALL') {
      where.status = status as UserStatus;
    }

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
        skip,
        take,
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
      // Stats Summary
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
      data: items,
      stats,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  }

  async getKYCStats(from?: string, to?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const approvedQuery: Record<string, any> = {
      verificationStatus: KYCVerificationStatus.APPROVED,
    };
    const rejectedQuery: Record<string, any> = {
      verificationStatus: KYCVerificationStatus.REJECTED,
    };

    if (from || to) {
      approvedQuery.verifiedAt = {};
      rejectedQuery.updatedAt = {};
      if (from) {
        approvedQuery.verifiedAt.gte = new Date(from);
        rejectedQuery.updatedAt.gte = new Date(from);
      }
      if (to) {
        approvedQuery.verifiedAt.lte = new Date(to);
        rejectedQuery.updatedAt.lte = new Date(to);
      }
    } else {
      approvedQuery.verifiedAt = { gte: today };
      rejectedQuery.updatedAt = { gte: today };
    }

    const [pending, approvedToday, rejectedToday] = await Promise.all([
      this.prisma.user.count({
        where: { status: UserStatus.PENDING_APPROVAL },
      }),
      this.prisma.kYCData.count({
        where: approvedQuery,
      }),
      this.prisma.kYCData.count({
        where: rejectedQuery,
      }),
    ]);

    return { pending, approvedToday, rejectedToday };
  }

  async getActiveUsersCount() {
    return this.prisma.user.count({
      where: {
        status: UserStatus.ACTIVE,
      },
    });
  }

  async getActiveUsersCountBefore(date: Date) {
    return this.prisma.user.count({
      where: {
        status: UserStatus.ACTIVE,
        createdAt: { lt: date },
      },
    });
  }

  async getKycApprovedCountBetween(from: Date, to: Date) {
    return this.prisma.kYCData.count({
      where: {
        verificationStatus: KYCVerificationStatus.APPROVED,
        verifiedAt: {
          gte: from,
          lte: to,
        },
      },
    });
  }

  async getPendingKYCList() {
    const list = await this.getKYCList(UserStatus.PENDING_APPROVAL);
    return list.data;
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
          kycData.idCardNumberEncrypted = this.cryptoService.decryptPii(
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
      // Audit History (Manual Join with Staff)
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
}

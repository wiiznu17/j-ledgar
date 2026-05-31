import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { FinanceService } from '../../integration/finance.service';
import {
  AuditService,
  AuditAction,
  ResourceType,
} from '../../audit/audit.service';
import { StorageService } from '../../../core/storage/storage.service';
import { ApplyMerchantDto } from '../../../user/merchant/dto/apply-merchant.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class MerchantApplicationService {
  private readonly logger = new Logger(MerchantApplicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
  ) {}

  async applyMerchant(userId: string, body: ApplyMerchantDto) {
    // 1. Check if user already has a partner record or if taxId is already registered
    const existingPartner = await this.prisma.partner.findFirst({
      where: {
        OR: [{ userId }, { taxId: body.taxId }],
      },
    });

    if (existingPartner && existingPartner.status !== 'REJECTED') {
      const message =
        existingPartner.userId === userId
          ? 'You already have a merchant account or pending application'
          : 'This Tax ID is already registered by another user';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }

    // Format phone to +66 (Thai E.164)
    const formattedPhone = body.phone.startsWith('0')
      ? `+66${body.phone.substring(1)}`
      : body.phone;

    return this.prisma.$transaction(async (tx) => {
      // 2. Create or Update Partner record
      let partner;
      const partnerData = {
        userId,
        name: body.businessName,
        taxId: body.taxId,
        status: 'PENDING_REVIEW' as any,
        metadata: {
          contactName: body.contactName,
          email: body.email || '',
          phone: formattedPhone,
          address: body.address,
          addressDetail: body.addressDetail,
          category: body.category,
          businessNameEn: body.businessNameEn,
          images: body.images || [],
          location:
            body.latitude && body.longitude
              ? { lat: Number(body.latitude), lng: Number(body.longitude) }
              : null,
        } as any,
      };

      if (existingPartner) {
        partner = await tx.partner.update({
          where: { id: existingPartner.id },
          data: partnerData,
        });
      } else {
        partner = await tx.partner.create({
          data: partnerData,
        });
      }

      // 3. Create MerchantApplication record
      const application = await tx.merchantApplication.create({
        data: {
          partnerId: partner.id,
          userId,
          businessName: body.businessName,
          businessNameEn: body.businessNameEn,
          category: body.category,
          salesChannel: body.salesChannel || 'PHYSICAL_STORE',
          contactName: body.contactName,
          email: body.email || '',
          phone: formattedPhone,
          taxId: body.taxId,
          address: body.address,
          addressDetail: body.addressDetail,
          ownerIdCardNumber: body.ownerIdCardNumber,
          ownerBirthDate: body.ownerBirthDate,
          images: body.images || [],
          location:
            body.latitude && body.longitude
              ? { lat: Number(body.latitude), lng: Number(body.longitude) }
              : null,
          status: 'PENDING',
        },
      });

      await this.auditService.log({
        adminUserId: null,
        action: AuditAction.CREATE, // We can add a custom action if needed
        resourceType: ResourceType.MERCHANT,
        resourceId: application.id,
        ipAddress: '0.0.0.0',
        userAgent: 'User/Mobile',
        requestPayload: body,
        responseStatus: 201,
      });

      return {
        success: true,
        applicationId: application.id,
        status: application.status,
      };
    });
  }

  async findApplications(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { businessName: { contains: query.search, mode: 'insensitive' } },
        { taxId: { contains: query.search, mode: 'insensitive' } },
        { contactName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [applications, total] = await Promise.all([
      this.prisma.merchantApplication.findMany({
        where,
        skip,
        take: limit,
        include: { partner: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.merchantApplication.count({ where }),
    ]);

    await this.presignApplicationImages(applications);

    return {
      data: applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async reviewApplication(
    id: string,
    body: { status: 'APPROVED' | 'REJECTED'; note?: string },
  ) {
    const application = await this.prisma.merchantApplication.findUnique({
      where: { id },
      include: { partner: true },
    });

    if (!application)
      throw new HttpException('Application not found', HttpStatus.NOT_FOUND);
    if (application.status !== 'PENDING') {
      throw new HttpException(
        'Application already processed',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (body.status === 'REJECTED') {
      return this.prisma.$transaction(async (tx) => {
        // Update Application
        const updatedApp = await tx.merchantApplication.update({
          where: { id },
          data: {
            status: 'REJECTED',
            reviewNote: body.note,
          },
        });

        // Update Partner
        await tx.partner.update({
          where: { id: application.partnerId },
          data: { status: 'REJECTED' },
        });

        return updatedApp;
      });
    }

    // Process APPROVAL
    try {
      // 1. Create Merchant Accounts in Ledger (Finance Service)
      // We do this BEFORE DB update because if it fails, we want to stop
      let financeAccounts = {
        available: null,
        pending: null,
        fee: null,
        vat: null,
      };

      try {
        const bizName =
          application.businessName || `Merchant ${application.partnerId}`;
        const [availableAcc, pendingAcc, feeAcc, vatAcc] = await Promise.all([
          this.financeService.createAccount(
            application.partnerId,
            `${bizName} - Available`,
            'THB',
            'AVAILABLE',
          ),
          this.financeService.createAccount(
            application.partnerId,
            `${bizName} - Pending`,
            'THB',
            'PENDING',
          ),
          this.financeService.createAccount(
            application.partnerId,
            `${bizName} - Fee`,
            'THB',
            'FEE',
          ),
          this.financeService.createAccount(
            application.partnerId,
            `${bizName} - VAT`,
            'THB',
            'VAT',
          ),
        ]);

        if (
          !availableAcc?.id ||
          !pendingAcc?.id ||
          !feeAcc?.id ||
          !vatAcc?.id
        ) {
          throw new Error('Finance service returned invalid account IDs');
        }

        if (
          availableAcc.id === '0' ||
          pendingAcc.id === '0' ||
          feeAcc.id === '0' ||
          vatAcc.id === '0'
        ) {
          throw new Error(
            'Received invalid "0" account ID from finance service',
          );
        }

        financeAccounts = {
          available: availableAcc.id,
          pending: pendingAcc.id,
          fee: feeAcc.id,
          vat: vatAcc.id,
        };
      } catch (error) {
        this.logger.error(
          `Merchant approval failed at account creation: ${error.message}`,
        );
        throw new HttpException(
          `ไม่สามารถอนุมัติได้: ระบบบัญชีกลางขัดข้อง (${error.message})`,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      return await this.prisma.$transaction(async (tx) => {
        // 2. Update Application Status
        const updated = await tx.merchantApplication.update({
          where: { id },
          data: {
            status: 'APPROVED',
            reviewNote: body.note,
          },
        });

        // 3. Update Partner Status & Create Profile
        await tx.partner.update({
          where: { id: application.partnerId },
          data: {
            status: 'ACTIVE',
            type: 'SME',
            feeRate:
              (await this.financeService.getSystemSettings()).merchantFeeRate ||
              0.03, // Use system default
            financeAccounts: financeAccounts as any,
            profile: {
              create: {
                businessNameEn: application.businessNameEn,
                category: application.category,
                contactName: application.contactName,
                email: application.email,
                phone: application.phone,
                address: application.address,
                addressDetail: application.addressDetail,
                location: application.location as any,
              },
            },
          },
        });

        // 4. Create Merchant Branch (if not exists)
        const existingMerchant = await tx.merchant.findFirst({
          where: { partnerId: application.partnerId },
        });

        if (!existingMerchant) {
          const newMerchant = await tx.merchant.create({
            data: {
              partnerId: application.partnerId,
              name: application.businessName,
              category: application.category,
              address: application.address,
              location: application.location as any,
              isActive: true,
            },
          });

          // 5. Create Default Terminal
          await tx.terminal.create({
            data: {
              merchantId: newMerchant.id,
              name: 'Main Terminal',
              secretKey: `sk_${randomBytes(16).toString('hex')}`,
              status: 'ACTIVE' as any,
            },
          });
        }

        await this.auditService.log({
          adminUserId: null,
          action: AuditAction.APPROVE,
          resourceType: ResourceType.MERCHANT,
          resourceId: application.id,
          ipAddress: '0.0.0.0',
          userAgent: 'System/Admin',
          requestPayload: body,
          responseStatus: 200,
        });

        return updated;
      });
    } catch (error: any) {
      this.logger.error(`Review application failed: ${error.message}`);
      throw new HttpException(
        error.message || 'Review process failed',
        error.status || 500,
      );
    }
  }

  async getMerchantDashboard(userId: string) {
    const partner = await this.prisma.partner.findFirst({
      where: { userId },
      include: { profile: true },
    });

    if (!partner) {
      // Check if there's a pending application
      const application = await this.prisma.merchantApplication.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return {
        isMerchant: false,
        applicationStatus: application?.status || null,
        message: application
          ? `Your application is ${application.status.toLowerCase()}`
          : 'No merchant account found',
      };
    }

    if (partner.status === 'PENDING_REVIEW') {
      return {
        isMerchant: false,
        applicationStatus: 'PENDING',
        message: 'Your merchant application is currently under review',
      };
    }

    if (partner.status === 'REJECTED') {
      const application = await this.prisma.merchantApplication.findFirst({
        where: { partnerId: partner.id },
        orderBy: { createdAt: 'desc' },
      });
      return {
        isMerchant: false,
        applicationStatus: 'REJECTED',
        rejectionReason: application?.reviewNote,
        message: 'Your merchant application was rejected',
      };
    }

    const merchants = await this.prisma.merchant.findMany({
      where: { partnerId: partner.id },
      select: { id: true },
    });
    const merchantIds = merchants.map((m) => m.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [transactions, activeTerminals] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          resourceType: ResourceType.MERCHANT,
          resourceId: { in: merchantIds },
          action: AuditAction.MERCHANT_PAYMENT,
          createdAt: { gte: today },
        },
      }),
      this.prisma.terminal.count({
        where: {
          merchantId: { in: merchantIds },
          status: 'ACTIVE',
        },
      }),
    ]);

    const todaySales = transactions.reduce((sum, log) => {
      return sum + ((log.requestPayload as any)?.amount || 0);
    }, 0);

    // Fetch real-time balance if finance accounts exist
    let availableBalance = 0;
    const financeAccounts = partner.financeAccounts as any;
    if (financeAccounts?.available) {
      try {
        const acc = await this.financeService.getAccountDetail(
          financeAccounts.available,
        );
        availableBalance = Number(acc.balance);
      } catch (error) {
        this.logger.warn(
          `Failed to fetch balance for partner ${partner.id}: ${error.message}`,
        );
      }
    }

    return {
      isMerchant: true,
      merchantId: merchants[0]?.id,
      totalRevenue: todaySales,
      totalTransactions: transactions.length,
      activeTerminals,
      totalMerchantBalance: availableBalance,
      profile: {
        name: partner.name,
        businessNameEn: partner.profile?.businessNameEn,
        category: partner.profile?.category || (merchants[0] as any)?.category,
        logoUrl: partner.profile?.logoUrl,
      },
    };
  }

  private extractS3Key(urlOrKey: string): string {
    if (!urlOrKey) return '';
    if (!urlOrKey.startsWith('http')) return urlOrKey;

    try {
      const url = new URL(urlOrKey);
      const pathDecoded = decodeURIComponent(url.pathname);
      const parts = pathDecoded.split('/').filter(Boolean);
      if (url.hostname.includes('s3.') && parts.length > 1) {
        return parts.slice(1).join('/');
      }
      return parts.join('/');
    } catch {
      const match = urlOrKey.match(/\.com\/(.+)$/);
      return match ? decodeURIComponent(match[1]) : urlOrKey;
    }
  }

  private async presignApplicationImages(apps: any[]) {
    if (!apps || apps.length === 0) return;

    for (const app of apps) {
      if (app.images && app.images.length > 0) {
        app.images = await Promise.all(
          app.images.map(async (img: string) => {
            try {
              const key = this.extractS3Key(img);
              return await this.storageService.getPresignedUrl(key);
            } catch (err) {
              this.logger.error(`Failed to presign storefront image: ${img}`, err);
              return img;
            }
          })
        );
      }
    }
  }
}

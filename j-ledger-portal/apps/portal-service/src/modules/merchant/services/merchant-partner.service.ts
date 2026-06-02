import { Injectable, HttpException, HttpStatus, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { IntegrationService } from '../../integration/integration.service';
import { FinanceService } from '../../../core/finance/finance.service';
import {
  AuditService,
  AuditAction,
  ResourceType,
} from '../../audit/audit.service';
import { StorageService } from '../../../core/storage/storage.service';
import { PaginationUtility } from '../../../common/utils/pagination.util';

@Injectable()
export class MerchantPartnerService {
  private readonly logger = new Logger(MerchantPartnerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationService: IntegrationService,
    private readonly financeService: FinanceService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
  ) {}

  async findAllPartners(query: any) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { taxId: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const allowedSortFields = ['name', 'createdAt', 'status'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const result = await PaginationUtility.paginate(
      (opts) =>
        this.prisma.partner.findMany({
          where,
          ...opts,
          include: {
            _count: {
              select: { merchants: true },
            },
          },
        }),
      () => this.prisma.partner.count({ where }),
      {
        page: query.page,
        limit: query.limit,
        sortBy: finalSortBy,
        sortOrder,
      },
    );

    return {
      ...result,
      data: this.maskMerchantSecrets(result.data),
    };
  }

  async findPartnerById(id: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      include: {
        profile: true,
        merchants: {
          include: { terminals: true },
        },
        applications: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { merchants: true },
        },
      },
    });

    if (!partner)
      throw new HttpException('Partner not found', HttpStatus.NOT_FOUND);

    if (partner.applications) {
      await this.presignApplicationImages(partner.applications);
    }

    // If partner has finance accounts, fetch the real-time balances
    const financeAccounts = partner.financeAccounts as any;
    if (
      financeAccounts &&
      (financeAccounts.available ||
        financeAccounts.pending ||
        financeAccounts.fee ||
        financeAccounts.vat)
    ) {
      try {
        const balances: any = {};

        if (financeAccounts.available) {
          const acc = await this.financeService.getAccountDetail(
            financeAccounts.available,
          );
          balances.available = acc.balance;
        }

        if (financeAccounts.pending) {
          const acc = await this.financeService.getAccountDetail(
            financeAccounts.pending,
          );
          balances.pending = acc.balance;
        }

        if (financeAccounts.fee) {
          const acc = await this.financeService.getAccountDetail(
            financeAccounts.fee,
          );
          balances.fee = acc.balance;
        }

        if (financeAccounts.vat) {
          const acc = await this.financeService.getAccountDetail(
            financeAccounts.vat,
          );
          balances.vat = acc.balance;
        }

        return {
          ...partner,
          financeAccounts: balances,
        };
      } catch (error: any) {
        this.logger.warn(
          `Failed to fetch finance balances for partner ${id}: ${error.message}`,
        );
      }
    }

    return partner;
  }

  async updatePartner(
    id: string,
    data: {
      name?: string;
      taxId?: string;
      profile?: any;
      isPaymentEnabled?: boolean;
      isLoyaltyEnabled?: boolean;
    },
  ) {
    const { profile, ...partnerData } = data;

    return this.prisma.partner.update({
      where: { id },
      data: {
        ...partnerData,
        profile: profile
          ? {
              upsert: {
                create: profile,
                update: profile,
              },
            }
          : undefined,
      },
      include: { profile: true },
    });
  }

  async updatePartnerStatus(id: string, status: boolean) {
    const partner = await this.prisma.partner.update({
      where: { id },
      data: { status: status ? 'ACTIVE' : 'INACTIVE' },
    });

    await this.auditService.log({
      adminUserId: null,
      action: status ? AuditAction.ACTIVATE : AuditAction.DEACTIVATE,
      resourceType: ResourceType.PARTNER,
      resourceId: id,
      ipAddress: '0.0.0.0',
      userAgent: 'System/Admin',
      requestPayload: { status },
      responseStatus: 200,
    });

    return partner;
  }

  async findPartnerMerchants(partnerId: string) {
    return this.prisma.merchant.findMany({
      where: { partnerId },
      include: {
        terminals: true,
      },
    });
  }

  async createPartnerManual(data: {
    name: string;
    taxId?: string;
    profile?: {
      businessNameEn?: string;
      category?: string;
      contactName?: string;
      email?: string;
      phone?: string;
      address?: string;
      addressDetail?: string;
      website?: string;
      logoUrl?: string;
    };
  }) {
    // 1. Create the partner first to get the ID
    const partner = await this.prisma.partner.create({
      data: {
        name: data.name,
        taxId: data.taxId,
        status: 'ACTIVE',
        type: 'CORPORATE',
        isPaymentEnabled: true,
        isLoyaltyEnabled: true,
        profile: data.profile
          ? {
              create: data.profile,
            }
          : undefined,
      },
      include: {
        profile: true,
      },
    });

    // 2. Create real financial accounts in the Finance Service
    try {
      const [availableAcc, pendingAcc, feeAcc] = await Promise.all([
        this.financeService.createAccount(
          partner.id,
          `${partner.name} - Available`,
        ),
        this.financeService.createAccount(
          partner.id,
          `${partner.name} - Pending`,
        ),
        this.financeService.createAccount(partner.id, `${partner.name} - Fee`),
      ]);

      // 3. Update the partner with the real account IDs
      const updatedPartner = await this.prisma.partner.update({
        where: { id: partner.id },
        data: {
          financeAccounts: {
            available: availableAcc.id,
            pending: pendingAcc.id,
            fee: feeAcc.id,
          },
        },
        include: { profile: true },
      });

      this.logger.log(
        `Manual partner created with finance accounts: ${partner.name} (${partner.id})`,
      );
      return updatedPartner;
    } catch (error) {
      this.logger.error(
        `Failed to create finance accounts for partner ${partner.id}:`,
        error,
      );
      // We still return the partner even if account creation failed,
      // though ideally we should handle this more robustly.
      return partner;
    }
  }

  async createMerchant(
    partnerId: string,
    data: { name: string; address?: string },
  ) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
    });

    if (!partner)
      throw new HttpException('Partner not found', HttpStatus.NOT_FOUND);

    // ENFORCE: SME (partner.type === 'SME') can only have 1 merchant branch
    if (partner.type === 'SME') {
      const count = await this.prisma.merchant.count({
        where: { partnerId },
      });
      if (count >= 1) {
        throw new HttpException(
          'SME partners are restricted to a single merchant branch.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const merchant = await this.prisma.merchant.create({
      data: {
        partnerId,
        name: data.name,
        address: data.address,
        isActive: true,
      },
    });

    this.logger.log(
      `Manual merchant branch created: ${merchant.name} (Partner: ${partnerId})`,
    );
    return merchant;
  }

  private maskMerchantSecrets(data: any): any {
    if (!data) return data;
    if (Array.isArray(data))
      return data.map((i) => this.maskMerchantSecrets(i));
    if (typeof data !== 'object') return data;

    const masked = { ...data };
    if (masked.secretKey) delete masked.secretKey;

    // Recursively mask nested objects
    for (const key in masked) {
      if (typeof masked[key] === 'object') {
        masked[key] = this.maskMerchantSecrets(masked[key]);
      }
    }
    return masked;
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

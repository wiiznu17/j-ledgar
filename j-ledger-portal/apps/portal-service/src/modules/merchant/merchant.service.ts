import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { IntegrationService } from '../integration/integration.service';
import { FinanceService } from '../integration/finance.service';
import { AuditService, AuditAction, ResourceType } from '../audit/audit.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomBytes, randomUUID, timingSafeEqual, createHmac } from 'crypto';
import { TerminalIdempotencyService } from './security/terminal-idempotency.service';
import { ApplyMerchantDto } from '../../user/merchant/dto/apply-merchant.dto';

@Injectable()
export class MerchantService {
  private readonly logger = new Logger(MerchantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationService: IntegrationService,
    private readonly financeService: FinanceService,
    private readonly auditService: AuditService,
    private readonly idempotencyService: TerminalIdempotencyService,
  ) {}

  async validateTerminalSignature(
    terminalId: string,
    signature: string,
    timestamp: string,
    nonce: string,
    method: string,
    path: string,
  ): Promise<boolean> {
    const terminal = await this.prisma.terminal.findUnique({
      where: { id: terminalId },
    });

    if (!terminal || terminal.status !== 'ACTIVE') return false;

    const message = `${method.toUpperCase()}:${path}:${timestamp}:${nonce}`;
    const computedSignature = createHmac('sha256', terminal.secretKey)
      .update(message)
      .digest('hex');

    if (computedSignature.length !== signature.length) {
      return false;
    }
    return timingSafeEqual(
      Buffer.from(computedSignature, 'utf8'),
      Buffer.from(signature, 'utf8'),
    );
  }

  async findAllPartners(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    
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

    const [partners, total] = await Promise.all([
      this.prisma.partner.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { merchants: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.partner.count({ where }),
    ]);

    return {
      data: this.maskMerchantSecrets(partners),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findApplications(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = query.status && query.status !== 'ALL' ? { status: query.status } : {};

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

  async updatePartner(id: string, data: { 
    name?: string; 
    taxId?: string;
    profile?: any;
  }) {
    const { profile, ...partnerData } = data;

    return this.prisma.partner.update({
      where: { id },
      data: {
        ...partnerData,
        profile: profile ? {
          upsert: {
            create: profile,
            update: profile,
          }
        } : undefined
      },
      include: { profile: true }
    });
  }

  async findPartnerById(id: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      include: {
        profile: true,
        merchants: {
          include: { terminals: true },
        },
        _count: {
          select: { merchants: true },
        },
      },
    });

    if (!partner) throw new HttpException('Partner not found', HttpStatus.NOT_FOUND);

    // If partner has finance accounts, fetch the real-time balances
    const financeAccounts = partner.financeAccounts as any;
    if (financeAccounts && (financeAccounts.available || financeAccounts.pending || financeAccounts.fee)) {
      try {
        const balances: any = {};
        
        if (financeAccounts.available) {
          const acc = await this.financeService.getAccountDetail(financeAccounts.available);
          balances.available = acc.balance;
        }
        
        if (financeAccounts.pending) {
          const acc = await this.financeService.getAccountDetail(financeAccounts.pending);
          balances.pending = acc.balance;
        }

        if (financeAccounts.fee) {
          const acc = await this.financeService.getAccountDetail(financeAccounts.fee);
          balances.fee = acc.balance;
        }

        return {
          ...partner,
          financeAccounts: balances,
        };
      } catch (error) {
        this.logger.warn(`Failed to fetch finance balances for partner ${id}: ${error.message}`);
      }
    }

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

  async findTerminalsByMerchantId(merchantId: string) {
    const terminals = await this.prisma.terminal.findMany({
      where: { merchantId },
    });
    return this.maskMerchantSecrets(terminals);
  }

  async reviewApplication(id: string, body: { status: 'APPROVED' | 'REJECTED'; note?: string }) {
    const application = await this.prisma.merchantApplication.findUnique({
      where: { id },
      include: { partner: true },
    });

    if (!application) throw new HttpException('Application not found', HttpStatus.NOT_FOUND);
    if (application.status !== 'PENDING') {
      throw new HttpException('Application already processed', HttpStatus.BAD_REQUEST);
    }

    if (body.status === 'REJECTED') {
      return this.prisma.merchantApplication.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewNote: body.note,
        },
      });
    }

    // Process APPROVAL
    try {
      // 1. Create Merchant Accounts in Ledger (Finance Service)
      // We do this BEFORE DB update because if it fails, we want to stop
      let financeAccounts = { available: null, pending: null, fee: null };
      
      try {
        const [availableAcc, pendingAcc, feeAcc] = await Promise.all([
          this.financeService.createAccount(application.partnerId, 'Available Balance'),
          this.financeService.createAccount(application.partnerId, 'Pending Balance'),
          this.financeService.createAccount(application.partnerId, 'Fee Account'),
        ]);
        
        financeAccounts = {
          available: availableAcc.id,
          pending: pendingAcc.id,
          fee: feeAcc.id,
        };
      } catch (error) {
        this.logger.error(`Failed to create finance accounts for partner ${application.partnerId}: ${error.message}`);
        // For development/testing, we might want to continue even if finance service fails
        // but for production, we should probably throw here.
        // throw new HttpException('Failed to initialize finance accounts', HttpStatus.INTERNAL_SERVER_ERROR);
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
              }
            }
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
      throw new HttpException(error.message || 'Review process failed', error.status || 500);
    }
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

  async createTerminal(merchantId: string, body: { name: string; hardwareId?: string }) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      include: { partner: true },
    });

    if (!merchant) throw new HttpException('Merchant not found', HttpStatus.NOT_FOUND);

    // ENFORCE: SME (partner.type === 'SME') can only have 1 terminal
    if (merchant.partner.type === 'SME') {
      const count = await this.prisma.terminal.count({
        where: { merchantId },
      });
      if (count >= 1) {
        throw new HttpException('SME merchants are restricted to a single terminal node.', HttpStatus.BAD_REQUEST);
      }
    }

    const secretKey = 'sk_' + randomBytes(24).toString('hex');
    const hardwareId = body.hardwareId || 'HW-' + randomBytes(4).toString('hex').toUpperCase();

    const terminal = await this.prisma.terminal.create({
      data: {
        merchantId,
        name: body.name,
        hardwareId,
        secretKey,
        status: 'ACTIVE',
      },
    });

    await this.auditService.log({
      adminUserId: null,
      action: AuditAction.CREATE,
      resourceType: ResourceType.TERMINAL,
      resourceId: terminal.id,
      ipAddress: '0.0.0.0',
      userAgent: 'System/Admin',
      requestPayload: { merchantId, name: body.name, hardwareId }, // DON'T log secretKey
      responseStatus: 201,
    });

    return terminal; // On creation, we return it ONCE so admin can give it to merchant
  }

  private maskMerchantSecrets(data: any): any {
    if (!data) return data;
    if (Array.isArray(data)) return data.map(i => this.maskMerchantSecrets(i));
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

  async getMerchantTerminals(merchantUserId: string) {
    const partner = await this.prisma.partner.findFirst({
      where: { userId: merchantUserId },
      include: {
        merchants: {
          include: { terminals: true },
        },
      },
    });

    if (!partner) throw new HttpException('Partner not found', HttpStatus.NOT_FOUND);

    return partner.merchants.flatMap(m => m.terminals.map(t => ({
      id: t.id,
      name: t.name,
      hardwareId: t.hardwareId,
      status: t.status,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      branchName: m.name,
    })));
  }

  async getMerchantDashboard(userId: string) {
    const partner = await this.prisma.partner.findFirst({
      where: { userId },
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
        message: application ? `Your application is ${application.status.toLowerCase()}` : 'No merchant account found',
      };
    }

    if (partner.status === 'PENDING_REVIEW') {
      return {
        isMerchant: false,
        applicationStatus: 'PENDING',
        message: 'Your merchant application is currently under review',
      };
    }

    const merchantIds = await this.prisma.merchant.findMany({
      where: { partnerId: partner.id },
      select: { id: true },
    }).then(ms => ms.map(m => m.id));

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

    return {
      isMerchant: true,
      totalRevenue: todaySales,
      totalTransactions: transactions.length,
      activeTerminals,
      totalMerchantBalance: (partner.financeAccounts as any)?.available || 0,
    };
  }

  async applyMerchant(userId: string, body: ApplyMerchantDto) {
    // 1. Check if user already has a partner record or if taxId is already registered
    const existingPartner = await this.prisma.partner.findFirst({
      where: {
        OR: [
          { userId },
          { taxId: body.taxId }
        ]
      },
    });

    if (existingPartner) {
      const message = existingPartner.userId === userId 
        ? 'You already have a merchant account or pending application'
        : 'This Tax ID is already registered by another user';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }

    // Format phone to +66 (Thai E.164)
    const formattedPhone = body.phone.startsWith('0') 
      ? `+66${body.phone.substring(1)}` 
      : body.phone;

    return this.prisma.$transaction(async (tx) => {
      // 2. Create Partner record
      const partner = await tx.partner.create({
        data: {
          userId,
          name: body.businessName,
          taxId: body.taxId,
          status: 'PENDING_REVIEW',
          metadata: {
            contactName: body.contactName,
            email: body.email || '',
            phone: formattedPhone,
            address: body.address,
            addressDetail: body.addressDetail,
            category: body.category,
            businessNameEn: body.businessNameEn,
            images: body.images || [],
            location: body.latitude && body.longitude ? { lat: Number(body.latitude), lng: Number(body.longitude) } : null,
          } as any,
        },
      });

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
          location: body.latitude && body.longitude ? { lat: Number(body.latitude), lng: Number(body.longitude) } : null,
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

  async getMerchantTransactions(userId: string, query: any) {
    const partner = await this.prisma.partner.findFirst({
      where: { userId },
      include: { merchants: true },
    }) as any;

    if (!partner) throw new HttpException('Partner not found', HttpStatus.NOT_FOUND);

    const merchantIds = partner.merchants.map((m: any) => m.id);

    return this.prisma.auditLog.findMany({
      where: {
        resourceType: ResourceType.MERCHANT,
        resourceId: { in: merchantIds },
        action: AuditAction.MERCHANT_PAYMENT,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async processTerminalPayment(terminalId: string, body: { amount: number; idempotencyKey: string; note?: string }) {
    return this.idempotencyService.handleIdempotency(
      terminalId,
      'PAYMENT',
      body.idempotencyKey,
      body,
      async () => {
        return this.prisma.$transaction(async (tx) => {
          const terminal = await tx.terminal.findUnique({
            where: { id: terminalId },
            include: { merchant: { include: { partner: true } } },
          }) as any;

          if (!terminal) throw new HttpException('Terminal not found', HttpStatus.NOT_FOUND);

          const amount = body.amount;
          const partnerId = terminal.merchant.partnerId;

          // 1. Acquire pessimistic lock on the partner using a dummy update
          // This is a reliable cross-database way to achieve SELECT FOR UPDATE in Prisma
          await tx.partner.update({
            where: { id: partnerId },
            data: { updatedAt: new Date() },
          });

          // 2. Atomic balance update
          const partner = await tx.partner.findUnique({ 
            where: { id: partnerId } 
          });
          
          if (!partner) throw new HttpException('Partner not found', HttpStatus.NOT_FOUND);

          const currentFinance = (partner.financeAccounts as any) || { available: 0, pending: 0, fee: 0 };
          const newFinance = {
            ...currentFinance,
            pending: Number(currentFinance.pending || 0) + amount,
          };

          await tx.partner.update({
            where: { id: partnerId },
            data: { financeAccounts: newFinance as any },
          });

          const txId = `txn_pmt_${randomUUID()}`;

          // Log Audit inside transaction
          await tx.auditLog.create({
            data: {
              adminUserId: null,
              action: AuditAction.MERCHANT_PAYMENT,
              resourceType: ResourceType.MERCHANT,
              resourceId: terminal.merchantId,
              ipAddress: '0.0.0.0',
              userAgent: 'Terminal/' + terminal.hardwareId,
              requestPayload: { 
                terminalId, 
                amount, 
                idempotencyKey: body.idempotencyKey,
                note: body.note,
                transactionId: txId
              },
              responseStatus: 201,
            },
          });

          return {
            status: HttpStatus.CREATED,
            data: {
              success: true,
              transactionId: txId,
              amount,
              currency: 'THB',
            },
          };
        });
      }
    );
  }

  async processTerminalRedemption(terminalId: string, body: { redemptionCode: string; idempotencyKey: string }) {
    return this.idempotencyService.handleIdempotency(
      terminalId,
      'REDEEM',
      body.idempotencyKey,
      body,
      async () => {
        return this.prisma.$transaction(async (tx) => {
          const terminal = await tx.terminal.findUnique({
            where: { id: terminalId },
            include: { merchant: true },
          }) as any;

          if (!terminal) throw new HttpException('Terminal not found', HttpStatus.NOT_FOUND);

          const usedAt = new Date();
          const applied = await tx.dealRedemption.updateMany({
            where: {
              redemptionCode: body.redemptionCode,
              status: 'REDEEMED' as any,
            },
            data: {
              status: 'USED' as any,
              usedAt,
              usedAtMerchantId: terminal.merchantId,
            },
          });
          if (applied.count === 0) {
            const existing = await tx.dealRedemption.findUnique({
              where: { redemptionCode: body.redemptionCode },
            });
            if (!existing) {
              throw new HttpException('Redemption code not found', HttpStatus.NOT_FOUND);
            }
            throw new HttpException('Invalid or already used code', HttpStatus.BAD_REQUEST);
          }

          await tx.auditLog.create({
            data: {
              adminUserId: null,
              action: AuditAction.MERCHANT_REDEMPTION,
              resourceType: ResourceType.MERCHANT,
              resourceId: terminal.merchantId,
              ipAddress: '0.0.0.0',
              userAgent: 'Terminal/' + terminal.hardwareId,
              requestPayload: { 
                terminalId, 
                redemptionCode: body.redemptionCode, 
                idempotencyKey: body.idempotencyKey 
              },
              responseStatus: 200,
            },
          });

          return {
            status: HttpStatus.OK,
            data: {
              success: true,
              redemptionCode: body.redemptionCode,
              usedAt,
            },
          };
        });
      }
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runDailySettlement() {
    console.log('🌅 Starting daily merchant settlement...');
    const partners = await this.prisma.partner.findMany();

    for (const partner of partners) {
      const finance = (partner.financeAccounts as any);
      if (!finance || !finance.pending || finance.pending <= 0) continue;

      const pendingAmount = Number(finance.pending);
      const mdrFee = pendingAmount * 0.03; // 3% fee
      const netAmount = pendingAmount - mdrFee;

      const updatedFinance = {
        available: Number(finance.available || 0) + netAmount,
        pending: 0,
        fee: Number(finance.fee || 0) + mdrFee,
      };

      await this.prisma.partner.update({
        where: { id: partner.id },
        data: { financeAccounts: updatedFinance as any },
      });

      await this.auditService.log({
        adminUserId: null,
        action: AuditAction.SETTLEMENT,
        resourceType: ResourceType.MERCHANT,
        resourceId: partner.id,
        ipAddress: '127.0.0.1',
        userAgent: 'System/Cron',
        requestPayload: { pendingAmount, mdrFee, netAmount },
        responseStatus: 200,
      });
    }
    console.log('✅ Settlement completed.');
  }

  // ==================== Redemption Management (Option 2) ====================

  async verifyRedemption(code: string, terminalId: string) {
    const redemption = await this.prisma.dealRedemption.findUnique({
      where: { redemptionCode: code },
      include: {
        deal: {
          include: { brand: true },
        },
      },
    });

    if (!redemption) {
      throw new HttpException('Invalid redemption code', HttpStatus.NOT_FOUND);
    }

    if (redemption.status !== 'REDEEMED') {
      const statusMsg = redemption.status === 'USED' ? 'Code already used' : 'Code expired or cancelled';
      throw new HttpException(statusMsg, HttpStatus.BAD_REQUEST);
    }

    if (redemption.expiresAt && new Date() > redemption.expiresAt) {
      // Auto-expire if needed
      await this.prisma.dealRedemption.update({
        where: { id: redemption.id },
        data: { status: 'EXPIRED' },
      });
      throw new HttpException('Code expired', HttpStatus.BAD_REQUEST);
    }

    return {
      isValid: true,
      dealTitle: redemption.deal.title,
      brandName: redemption.deal.brand.name,
      pointsSpent: redemption.pointsSpent,
      expiresAt: redemption.expiresAt,
    };
  }

  async useRedemption(code: string, terminalId: string) {
    const terminal = await this.prisma.terminal.findUnique({
      where: { id: terminalId },
      include: {
        merchant: {
          include: { partner: true },
        },
      },
    });

    if (!terminal) throw new HttpException('Terminal not found', HttpStatus.UNAUTHORIZED);

    const redemption = await this.prisma.dealRedemption.findUnique({
      where: { redemptionCode: code },
    });

    if (!redemption) throw new HttpException('Invalid code', HttpStatus.NOT_FOUND);
    if (redemption.status !== 'REDEEMED') {
      throw new HttpException(`Code already ${redemption.status.toLowerCase()}`, HttpStatus.BAD_REQUEST);
    }

    // Update status to USED
    const updated = await this.prisma.dealRedemption.update({
      where: { id: redemption.id },
      data: {
        status: 'USED',
        usedAt: new Date(),
        usedAtMerchantId: terminal.merchantId,
      },
    });

    this.logger.log(`Redemption code ${code} used at terminal ${terminalId} (Merchant: ${terminal.merchantId})`);

    return {
      success: true,
      usedAt: updated.usedAt,
      redemptionId: updated.id,
    };
  }

  // ==================== Manual Management (Admin Operations) ====================

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
    }
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
        profile: data.profile ? {
          create: data.profile
        } : undefined,
      },
      include: {
        profile: true
      }
    });

    // 2. Create real financial accounts in the Finance Service
    try {
      const [availableAcc, pendingAcc, feeAcc] = await Promise.all([
        this.financeService.createAccount(partner.id, `${partner.name} - Available`),
        this.financeService.createAccount(partner.id, `${partner.name} - Pending`),
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
          }
        },
        include: { profile: true }
      });

      this.logger.log(`Manual partner created with finance accounts: ${partner.name} (${partner.id})`);
      return updatedPartner;
    } catch (error) {
      this.logger.error(`Failed to create finance accounts for partner ${partner.id}:`, error);
      // We still return the partner even if account creation failed, 
      // though ideally we should handle this more robustly.
      return partner;
    }
  }

  async createMerchant(partnerId: string, data: { name: string; address?: string }) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) throw new HttpException('Partner not found', HttpStatus.NOT_FOUND);

    // ENFORCE: SME (partner.type === 'SME') can only have 1 merchant branch
    if (partner.type === 'SME') {
      const count = await this.prisma.merchant.count({
        where: { partnerId },
      });
      if (count >= 1) {
        throw new HttpException('SME partners are restricted to a single merchant branch.', HttpStatus.BAD_REQUEST);
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

    this.logger.log(`Manual merchant branch created: ${merchant.name} (Partner: ${partnerId})`);
    return merchant;
  }

  async rotateTerminalSecret(terminalId: string) {
    const terminal = await this.prisma.terminal.findUnique({
      where: { id: terminalId },
    });

    if (!terminal) throw new HttpException('Terminal not found', HttpStatus.NOT_FOUND);

    const newSecret = randomBytes(32).toString('hex');

    const updated = await this.prisma.terminal.update({
      where: { id: terminalId },
      data: {
        secretKey: newSecret,
      },
    });

    this.logger.log(`Terminal secret rotated for node: ${terminalId}`);

    return {
      id: updated.id,
      name: updated.name,
      secretKey: newSecret,
    };
  }
}

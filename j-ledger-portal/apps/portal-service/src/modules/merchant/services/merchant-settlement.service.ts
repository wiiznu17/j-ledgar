import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { FinanceService } from '../../../core/finance/finance.service';
import { AuditService, AuditAction, ResourceType } from '../../audit/audit.service';

@Injectable()
export class MerchantSettlementService {
  private readonly logger = new Logger(MerchantSettlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
    private readonly auditService: AuditService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runDailySettlement() {
    console.log('🌅 Starting daily merchant settlement...');
    const partners = await this.prisma.partner.findMany();

    for (const partner of partners) {
      const finance = partner.financeAccounts as any;
      if (!finance || !finance.pending || !finance.available || !finance.fee) continue;

      try {
        // Fetch real-time balance of Pending Account in the Java Core Ledger
        const pendingAccount = await this.financeService.getAccountDetail(finance.pending);
        const pendingBalance = Number(pendingAccount.balance || 0);

        if (pendingBalance <= 0) {
          continue;
        }

        const feeRate = Number(partner.feeRate ?? 0.03);
        const mdrFee = Number((pendingBalance * feeRate).toFixed(2));
        const netAmount = Number((pendingBalance - mdrFee).toFixed(2));

        const timestamp = Date.now();

        // 1. Debit Pending and Credit Available (Net payout) in the Java Core Ledger
        await this.financeService.performTransfer({
          fromAccountId: finance.pending,
          toAccountId: finance.available,
          amount: netAmount.toFixed(2),
          note: `Settlement clear - Net payout`,
          idempotencyKey: `settle_net_${partner.id}_${timestamp}`,
          metadata: { partnerId: partner.id, settlementRun: true },
        });

        // 2. Debit Pending and Credit Fee in the Java Core Ledger
        if (mdrFee > 0) {
          await this.financeService.performTransfer({
            fromAccountId: finance.pending,
            toAccountId: finance.fee,
            amount: mdrFee.toFixed(2),
            note: `Settlement clear - MDR Fee (${(feeRate * 100).toFixed(1)}%)`,
            idempotencyKey: `settle_fee_${partner.id}_${timestamp}`,
            metadata: { partnerId: partner.id, settlementRun: true },
          });
        }

        // 3. Record audit log
        await this.auditService.log({
          adminUserId: null,
          action: AuditAction.SETTLEMENT,
          resourceType: ResourceType.MERCHANT,
          resourceId: partner.id,
          ipAddress: '127.0.0.1',
          userAgent: 'System/Cron',
          requestPayload: { pendingAmount: pendingBalance, mdrFee, netAmount, feeRate },
          responseStatus: 200,
        });

        this.logger.log(`[Settlement] Cleared ฿${pendingBalance.toFixed(2)} for partner ${partner.id} (Net: ฿${netAmount.toFixed(2)}, Fee: ฿${mdrFee.toFixed(2)})`);
      } catch (err: any) {
        this.logger.error(`[Settlement] Failed to clear settlement for partner ${partner.id}: ${err.message}`);
      }
    }
    console.log('✅ Settlement completed.');
  }

  async runSettlementForPartner(partnerId: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new HttpException('Partner not found', HttpStatus.NOT_FOUND);

    const finance = partner.financeAccounts as any;
    if (!finance || !finance.pending || !finance.available || !finance.fee) {
      throw new HttpException('Partner has no valid ledger accounts', HttpStatus.BAD_REQUEST);
    }

    // Fetch real-time balance of Pending Account in the Java Core Ledger
    const pendingAccount = await this.financeService.getAccountDetail(finance.pending);
    const pendingBalance = Number(pendingAccount.balance || 0);

    if (pendingBalance <= 0) {
      throw new HttpException('Merchant partner has no pending balance to settle', HttpStatus.BAD_REQUEST);
    }

    const feeRate = Number(partner.feeRate ?? 0.03);
    const mdrFee = Number((pendingBalance * feeRate).toFixed(2));
    const netAmount = Number((pendingBalance - mdrFee).toFixed(2));

    const timestamp = Date.now();

    // 1. Debit Pending and Credit Available (Net payout) in the Java Core Ledger
    await this.financeService.performTransfer({
      fromAccountId: finance.pending,
      toAccountId: finance.available,
      amount: netAmount.toFixed(2),
      note: `Settlement clear - Net payout (Manual)`,
      idempotencyKey: `settle_net_${partner.id}_${timestamp}`,
      metadata: { partnerId: partner.id, settlementRun: true, manual: true },
    });

    // 2. Debit Pending and Credit Fee in the Java Core Ledger
    if (mdrFee > 0) {
      await this.financeService.performTransfer({
        fromAccountId: finance.pending,
        toAccountId: finance.fee,
        amount: mdrFee.toFixed(2),
        note: `Settlement clear - MDR Fee (${(feeRate * 100).toFixed(1)}%) (Manual)`,
        idempotencyKey: `settle_fee_${partner.id}_${timestamp}`,
        metadata: { partnerId: partner.id, settlementRun: true, manual: true },
      });
    }

    // 3. Record audit log
    await this.auditService.log({
      adminUserId: null,
      action: AuditAction.SETTLEMENT,
      resourceType: ResourceType.MERCHANT,
      resourceId: partner.id,
      ipAddress: '127.0.0.1',
      userAgent: 'System/Admin (Manual)',
      requestPayload: { pendingAmount: pendingBalance, mdrFee, netAmount, feeRate, manual: true },
      responseStatus: 200,
    });
  }

  async getSettlementHistory(page: number = 1, limit: number = 20, search?: string, sortBy: string = 'createdAt', sortOrder: string = 'desc') {
    const skip = Math.max(0, (Number(page) - 1) * Number(limit));

    const where: any = {
      action: 'SETTLEMENT',
      resourceType: 'MERCHANT',
    };

    if (search && search.trim() !== '') {
      const term = search.trim();
      const matchingPartners = await this.prisma.partner.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { taxId: { contains: term, mode: 'insensitive' } },
            { id: { equals: term } },
          ],
        },
        select: { id: true },
      });
      const partnerIds = matchingPartners.map((p) => p.id);

      where.OR = [
        { resourceId: { in: partnerIds } },
        { resourceId: { equals: term } },
        { id: { equals: term } },
      ];
    }

    const orderColumn = sortBy === 'createdAt' ? 'createdAt' : 'createdAt';
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    const [logs, total, allLogsSelect] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { [orderColumn]: orderDirection },
        skip,
        take: Number(limit),
      }),
      this.prisma.auditLog.count({
        where,
      }),
      this.prisma.auditLog.findMany({
        where,
        select: {
          requestPayload: true,
        },
      }),
    ]);

    let totalVolume = 0;
    let totalFees = 0;
    for (const log of allLogsSelect) {
      const payload = log.requestPayload as any;
      if (payload) {
        totalVolume += Number(payload.pendingAmount || 0);
        totalFees += Number(payload.mdrFee || 0);
      }
    }

    return {
      data: logs.map((log: any) => ({
        id: log.id,
        partnerId: log.resourceId,
        action: log.action,
        createdAt: log.createdAt,
        payload: log.requestPayload,
      })),
      stats: {
        totalVolume: Number(totalVolume.toFixed(2)),
        totalFees: Number(totalFees.toFixed(2)),
        totalCount: total,
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }
}

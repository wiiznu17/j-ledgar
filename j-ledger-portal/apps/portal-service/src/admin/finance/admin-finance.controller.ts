import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { Roles } from '../decorators/roles.decorator';
import {
  AdminRole,
  AdminPaginatedResponse,
  Account,
  Transaction,
  TransactionDetailsDto,
  WalletDto,
  INTERNAL_API_PATHS,
} from '@repo/dto';

import { IntegrationService } from '../../modules/integration/integration.service';
import { LoyaltyService } from '../../modules/loyalty/loyalty.service';
import { REDIS_CLIENT } from '../../core/common/constants';
import Redis from 'ioredis';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BlacklistType, DisputeStatus } from '@prisma/client';

@Controller('admin')
@UseGuards(AdminJwtGuard, AdminRolesGuard)
export class AdminFinanceController {
  private readonly logger = new Logger(AdminFinanceController.name);

  constructor(
    private readonly integrationService: IntegrationService,
    private readonly loyaltyService: LoyaltyService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly prisma: PrismaService,
  ) {}

  // ==================== Account Management ====================

  @Get('accounts')
  async getAccounts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<AdminPaginatedResponse<Account>> {
    const skipPage = Math.max(0, page - 1);
    const query = new URLSearchParams({
      page: skipPage.toString(),
      size: limit.toString(),
      ...(status && status !== 'ALL' && { status }),
      ...(search && { search }),
    });

    // Proxy to finance-service
    const response = await this.integrationService.forwardToGateway<any>(
      'get',
      `${INTERNAL_API_PATHS.FINANCE.ACCOUNTS.BASE}?${query.toString()}`,
    );

    const content = Array.isArray(response) ? response : response.content || [];
    const totalElements = response.totalElements || content.length;
    const totalPages = response.totalPages || 1;

    return {
      data: content,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalElements,
        totalPages: totalPages,
      },
    };
  }

  @Get('accounts/user/:userId')
  async getAccountByUserId(
    @Param('userId') userId: string,
  ): Promise<{ data: Account | null }> {
    try {
      const account = await this.integrationService.forwardToGateway<Account>(
        'get',
        INTERNAL_API_PATHS.FINANCE.ACCOUNTS.USER(userId),
      );
      console.log(account);
      return { data: account };
    } catch (error) {
      console.log(error);
      // Return null if account not found or other errors
      return { data: null };
    }
  }

  @Get('accounts/:id')
  async getAccountDetail(@Param('id') id: string): Promise<{ data: Account }> {
    const account = await this.integrationService.forwardToGateway<Account>(
      'get',
      `${INTERNAL_API_PATHS.FINANCE.ACCOUNTS.BASE}/${id}`,
    );
    return { data: account };
  }

  @Get('accounts/:id/ledger-entries')
  async getLedgerEntries(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ): Promise<AdminPaginatedResponse<any>> {
    const skipPage = Math.max(0, page - 1);
    const response = await this.integrationService.forwardToGateway<any>(
      'get',
      `${INTERNAL_API_PATHS.FINANCE.ACCOUNTS.LEDGER_HISTORY(id)}?page=${skipPage}&size=${limit}`,
    );

    const content = response.content || [];
    const totalElements = response.totalElements || content.length;
    const totalPages = response.totalPages || 1;

    return {
      data: content,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalElements,
        totalPages: totalPages,
      },
    };
  }

  @Put('accounts/:id/status')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.AUDITOR)
  async updateAccountStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ): Promise<void> {
    await this.integrationService.forwardToGateway(
      'put',
      INTERNAL_API_PATHS.FINANCE.ACCOUNTS.STATUS(id),
      { status },
    );
  }

  // ==================== Wallet Management ====================

  @Get('wallets')
  async getWallets(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<AdminPaginatedResponse<WalletDto>> {
    const skipPage = Math.max(0, page - 1);
    const response = await this.integrationService.forwardToGateway<any>(
      'get',
      `${INTERNAL_API_PATHS.FINANCE.WALLETS.ADMIN_LIST}?page=${skipPage}&size=${limit}`,
    );

    const content = response.content || [];
    const totalElements = response.totalElements || content.length;
    const totalPages = response.totalPages || 1;

    return {
      data: content,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalElements,
        totalPages: totalPages,
      },
    };
  }

  @Post('wallets/:userId/freeze')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.AUDITOR)
  async freezeWallet(@Param('userId') userId: string): Promise<void> {
    await this.integrationService.forwardToGateway(
      'post',
      INTERNAL_API_PATHS.FINANCE.WALLETS.FREEZE(userId),
      {},
    );
  }

  @Post('wallets/:userId/unfreeze')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.AUDITOR)
  async unfreezeWallet(@Param('userId') userId: string): Promise<void> {
    await this.integrationService.forwardToGateway(
      'post',
      INTERNAL_API_PATHS.FINANCE.WALLETS.UNFREEZE(userId),
      {},
    );
  }

  @Get('wallets/:id')
  async getWalletDetail(@Param('id') id: string): Promise<{ data: WalletDto }> {
    const wallet = await this.integrationService.forwardToGateway<WalletDto>(
      'get',
      INTERNAL_API_PATHS.FINANCE.WALLETS.ADMIN_DETAIL(id),
    );
    return { data: wallet };
  }

  @Get('wallets/user/:userId')
  async getWalletByUserId(
    @Param('userId') userId: string,
  ): Promise<{ data: WalletDto | null }> {
    try {
      const wallet = await this.integrationService.forwardToGateway<WalletDto>(
        'get',
        INTERNAL_API_PATHS.FINANCE.WALLETS.GET(userId),
      );
      return { data: wallet };
    } catch (error) {
      return { data: null };
    }
  }

  // ==================== Transaction Management ====================

  @Get('transactions')
  async getTransactions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('userId') userId?: string,
    @Query('reference') reference?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AdminPaginatedResponse<Transaction>> {
    const skipPage = Math.max(0, page - 1);
    const query = new URLSearchParams({
      page: skipPage.toString(),
      size: limit.toString(),
      ...(status && { status }),
      ...(type && { type }),
      ...(userId && { userId }),
      ...(reference && { reference }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    // Proxy to finance-service
    const response = await this.integrationService.forwardToGateway<any>(
      'get',
      `${INTERNAL_API_PATHS.FINANCE.TRANSACTIONS.BASE}?${query.toString()}`,
    );
    const content = Array.isArray(response) ? response : response.content || [];
    const totalElements = response.totalElements || content.length;
    const totalPages = response.totalPages || 1;

    return {
      data: content,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalElements,
        totalPages: totalPages,
      },
    };
  }

  @Get('transactions/:id')
  async getTransactionDetails(
    @Param('id') id: string,
  ): Promise<TransactionDetailsDto> {
    const [transaction, ledgerEntries, pointHistories] = await Promise.all([
      this.integrationService.forwardToGateway<any>(
        'get',
        INTERNAL_API_PATHS.FINANCE.TRANSACTIONS.DETAIL(id),
      ),
      this.integrationService.forwardToGateway<any[]>(
        'get',
        `${INTERNAL_API_PATHS.FINANCE.TRANSACTIONS.DETAIL(id)}/ledger-entries`,
      ),
      this.loyaltyService.getPointHistoryByReference(id),
    ]);

    const earnedPoints = pointHistories.find((p) => p.amount > 0);

    return {
      transaction,
      ledgerEntries,
      pointsEarned: earnedPoints
        ? {
            amount: earnedPoints.amount,
            expiresAt: earnedPoints.expiresAt,
          }
        : undefined,
    };
  }

  // ==================== AML Management ====================

  @Get('aml/suspicious-activities')
  async getSuspiciousActivities(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('activityType') activityType?: string,
    @Query('minRiskScore') minRiskScore?: number,
    @Query('maxRiskScore') maxRiskScore?: number,
  ): Promise<AdminPaginatedResponse<any>> {
    const skipPage = Math.max(0, page - 1);
    const query = new URLSearchParams({
      page: skipPage.toString(),
      size: limit.toString(),
      ...(userId && { userId }),
      ...(status && { status }),
      ...(activityType && { activityType }),
      ...(minRiskScore && { minRiskScore: minRiskScore.toString() }),
      ...(maxRiskScore && { maxRiskScore: maxRiskScore.toString() }),
    });

    const response = await this.integrationService.forwardToGateway<any>(
      'get',
      `${INTERNAL_API_PATHS.FINANCE.AML.SUSPICIOUS_ACTIVITIES}?${query.toString()}`,
    );

    // Format to match UI expectations (PaginatedResponse)
    const content = Array.isArray(response) ? response : response.content || [];
    const totalElements = response.totalElements || content.length;
    const totalPages = response.totalPages || 1;

    return {
      data: content,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalElements,
        totalPages: totalPages,
      },
    };
  }

  @Put('aml/suspicious-activities/:id/status')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.AUDITOR, AdminRole.COMPLIANCE_OFFICER)
  async updateSuspiciousActivityStatus(
    @Param('id') id: string,
    @Body() data: any,
  ): Promise<void> {
    const javaPayload = {
      status: data.status,
      reviewedBy: data.reviewedBy || 'COMPLIANCE_OFFICER',
      description: data.description || data.notes || '',
    };
    await this.integrationService.forwardToGateway(
      'put',
      INTERNAL_API_PATHS.FINANCE.AML.SUSPICIOUS_ACTIVITY_STATUS(id),
      javaPayload,
    );
  }

  @Post('aml/suspicious-activities/:id/report')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.AUDITOR, AdminRole.COMPLIANCE_OFFICER)
  async reportSuspiciousActivityToAmlo(
    @Param('id') id: string,
    @Body() body: any,
  ): Promise<any> {
    return this.integrationService.forwardToGateway(
      'post',
      INTERNAL_API_PATHS.FINANCE.AML.REPORT_AMLO,
      {
        activityId: id,
        reviewedBy: 'COMPLIANCE_OFFICER',
      },
    );
  }

  // ==================== Treasury Management ====================

  @Get('treasury/summary')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.AUDITOR)
  async getTreasurySummary(): Promise<any> {
    const [financeSummary, stripeBalance] = await Promise.all([
      this.integrationService.forwardToGateway(
        'get',
        INTERNAL_API_PATHS.FINANCE.TREASURY.SUMMARY,
      ),
      this.integrationService.getStripeBalance(),
    ]);

    const rawAvailable = stripeBalance?.available || 0;
    const rawPending = stripeBalance?.pending || 0;
    const stripeTotal = rawAvailable + rawPending;

    const totalRealAssets =
      stripeTotal + (financeSummary.totalBankBalance || 0);

    const realReserveRatio =
      financeSummary.totalCustomerLiability > 0
        ? Math.round(
            (totalRealAssets / financeSummary.totalCustomerLiability) * 10000,
          ) / 100
        : 100;

    return {
      ...financeSummary,
      stripeAvailableBalance: rawAvailable,
      stripePendingBalance: rawPending,
      reserveRatio: realReserveRatio,
    };
  }

  @Get('treasury/payouts')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.AUDITOR)
  async getTreasuryPayouts(): Promise<any> {
    return this.integrationService.forwardToGateway(
      'get',
      INTERNAL_API_PATHS.FINANCE.TREASURY.PAYOUTS,
    );
  }

  @Post('treasury/payout')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.AUDITOR)
  async triggerTreasuryPayout(@Body('amount') amount: number): Promise<any> {
    const stripeBalance = await this.integrationService.getStripeBalance();
    const available = stripeBalance?.available || 0;
    if (amount > available) {
      throw new HttpException(
        {
          message: `Cannot sweep ฿${amount.toFixed(2)}. Your available Stripe balance is only ฿${available.toFixed(2)}.`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const stripePayoutId = `po_mock_${Math.random().toString(36).substring(2, 15)}`;
    await this.integrationService.forwardToGateway(
      'post',
      INTERNAL_API_PATHS.FINANCE.TREASURY.CONFIRM_STRIPE_PAYOUT,
      {
        stripePayoutId,
        amount: Number(amount).toFixed(4),
        arrivalDate: new Date().toISOString(),
      },
    );
    return { success: true, stripePayoutId };
  }

  // ==================== Support Disputes ====================

  @Get('disputes')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.AUDITOR, AdminRole.SUPPORT_AGENT)
  async getDisputes(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ): Promise<AdminPaginatedResponse<any> & { stats: any }> {
    const response = await this.integrationService.forwardToGateway<any>(
      'get',
      `${INTERNAL_API_PATHS.FINANCE.TRANSACTIONS.BASE}?page=0&size=500`,
    );

    const transactions = Array.isArray(response)
      ? response
      : response.content || [];

    // 1. Fetch persistent disputes from DB
    const dbDisputes = await this.prisma.dispute.findMany();
    const dbDisputeMap = new Map(dbDisputes.map((d) => [d.transactionId, d]));

    const searchTerm = search?.trim().toLowerCase();
    const normalizedStatus = status && status !== 'ALL' ? status : undefined;
    const normalizedType = type && type !== 'ALL' ? type : undefined;

    const disputes = transactions
      .map((transaction: any) => {
        const key = this.getDisputeKey(transaction);
        const dbDispute = dbDisputeMap.get(key);
        return this.buildDisputeRecord(
          transaction,
          dbDispute?.status ||
            (transaction.status === 'COMPLETED' ? 'RESOLVED' : 'PENDING'),
        );
      })
      .filter((dispute: any) => {
        const defaultQueueItem =
          dispute.transactionStatus !== 'COMPLETED' ||
          dispute.status === 'REVERSED';
        const matchesDefaultScope = normalizedStatus ? true : defaultQueueItem;
        const matchesStatus =
          !normalizedStatus || dispute.status === normalizedStatus;
        const matchesType =
          !normalizedType || dispute.transactionType === normalizedType;
        const matchesSearch =
          !searchTerm ||
          [
            dispute.id,
            dispute.transactionId,
            dispute.type,
            dispute.reason,
            dispute.sender,
            dispute.recipient,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(searchTerm));

        return (
          matchesDefaultScope && matchesStatus && matchesType && matchesSearch
        );
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 100);
    const start = (safePage - 1) * safeLimit;
    const paginated = disputes.slice(start, start + safeLimit);
    const hydrated = await Promise.all(
      paginated.map((dispute: any) => this.hydrateDisputeLedger(dispute)),
    );

    return {
      data: hydrated,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: disputes.length,
        totalPages: Math.max(1, Math.ceil(disputes.length / safeLimit)),
      },
      stats: {
        pending: disputes.filter((item: any) => item.status === 'PENDING')
          .length,
        reversed: disputes.filter((item: any) => item.status === 'REVERSED')
          .length,
        resolved: disputes.filter((item: any) => item.status === 'RESOLVED')
          .length,
        disputedAmount: disputes
          .filter((item: any) => item.status === 'PENDING')
          .reduce(
            (sum: number, item: any) => sum + Number(item.amount || 0),
            0,
          ),
      },
    };
  }

  @Post('disputes/:id/reverse')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.AUDITOR, AdminRole.SUPPORT_AGENT)
  async reverseDispute(@Param('id') id: string): Promise<{ success: boolean }> {
    // 1. Persist to DB
    await this.prisma.dispute.upsert({
      where: { id }, // This is the DSP-xxx ID
      update: { status: DisputeStatus.CLOSED, resolution: 'REVERSED' },
      create: {
        transactionId: id.replace('DSP-', ''),
        userId: 'Admin', // In real app, get from token
        reason: 'Customer requested reversal',
        status: DisputeStatus.CLOSED,
        resolution: 'REVERSED',
      },
    });

    // 2. Sync to Redis for existing legacy logic
    await this.redis.set(`admin:disputes:${id}:status`, 'REVERSED');
    await this.redis.set(
      `admin:disputes:${id}:updatedAt`,
      new Date().toISOString(),
    );
    return { success: true };
  }

  private getDisputeKey(transaction: any): string {
    return transaction.transactionId || transaction.referenceId || String(transaction.id);
  }

  private buildDisputeRecord(transaction: any, overrideStatus?: string) {
    const key = this.getDisputeKey(transaction);
    const transactionStatus = transaction.status || 'UNKNOWN';
    const transactionType =
      transaction.transactionType || transaction.type || 'TRANSACTION';
    const amount = Number(transaction.amount || 0);
    const status =
      overrideStatus ||
      (transactionStatus === 'COMPLETED' ? 'RESOLVED' : 'PENDING');

    return {
      id: `DSP-${key}`,
      disputeKey: key,
      transactionId: key,
      transactionInternalId: transaction.id,
      transactionType,
      transactionStatus,
      type: this.getDisputeType(transactionType, transactionStatus),
      sender:
        transaction.senderId ||
        transaction.fromAccountId ||
        transaction.fromWalletId ||
        'Source account unavailable',
      recipient:
        transaction.receiverId ||
        transaction.toAccountId ||
        transaction.toWalletId ||
        'Destination account unavailable',
      amount,
      reason: this.getDisputeReason(transaction),
      status,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      referenceId: transaction.referenceId,
    };
  }

  private getDisputeType(transactionType: string, transactionStatus: string) {
    if (transactionStatus === 'FAILED') return `${transactionType} Failure`;
    if (transactionStatus === 'CANCELLED') return `${transactionType} Cancelled`;
    if (transactionStatus === 'PENDING') return `${transactionType} Pending Review`;
    return `${transactionType} Review`;
  }

  private getDisputeReason(transaction: any) {
    if (transaction.description) return transaction.description;
    if (transaction.status === 'FAILED') {
      return 'Finance transaction failed and requires support verification.';
    }
    if (transaction.status === 'CANCELLED') {
      return 'Finance transaction was cancelled and is available for support audit.';
    }
    if (transaction.status === 'PENDING') {
      return 'Finance transaction is still pending and may need operational follow-up.';
    }
    return 'Transaction was reviewed through the support dispute workflow.';
  }

  private async hydrateDisputeLedger(dispute: any) {
    let ledgerEntries: any[] = [];

    try {
      ledgerEntries = await this.integrationService.forwardToGateway<any[]>(
        'get',
        `${INTERNAL_API_PATHS.FINANCE.TRANSACTIONS.DETAIL(dispute.transactionInternalId)}/ledger-entries`,
      );
    } catch (error) {
      this.logger.warn(
        `Unable to hydrate ledger entries for dispute ${dispute.id}: ${error.message}`,
      );
    }

    const debitLeg = ledgerEntries.find((entry) => entry.entryType === 'DEBIT');
    const creditLeg = ledgerEntries.find((entry) => entry.entryType === 'CREDIT');

    return {
      ...dispute,
      debitLeg: this.mapLedgerLeg(debitLeg, 'DEBIT'),
      creditLeg: this.mapLedgerLeg(creditLeg, 'CREDIT'),
      ledgerEntries,
    };
  }

  private mapLedgerLeg(entry: any, fallbackType: 'DEBIT' | 'CREDIT') {
    return {
      account:
        entry?.account?.accountName ||
        entry?.account?.id ||
        'Ledger entry unavailable',
      type: entry?.entryType || fallbackType,
      amount: Number(entry?.amount || 0),
      description: entry?.description || null,
    };
  }

  // ==================== Dynamic Blacklist Management (IP / Hardware Keys) ====================

  @Get('blacklist/nodes')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.AUDITOR)
  async getBlacklistNodes(): Promise<{ data: any[] }> {
    const records = await this.prisma.blacklist.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: records.map((r) => ({
        id: r.id,
        type: r.type,
        target: r.value,
        reason: r.reason || 'Gateway security restriction enforced.',
        severity: 'CRITICAL', // Default or could be added to model
        blacklistedAt: r.createdAt.toISOString().replace('T', ' ').substring(0, 16),
        enforcedBy: r.addedBy || 'Compliance Manual',
        status: r.isActive ? 'ACTIVE' : 'INACTIVE',
      })),
    };
  }

  @Post('blacklist/nodes/block')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.AUDITOR)
  async blockNode(
    @Body()
    body: {
      type: 'IP' | 'HARDWARE';
      target: string;
      reason: string;
      severity: string;
    },
  ): Promise<void> {
    const { type, target, reason } = body;
    const dbType = type === 'IP' ? BlacklistType.IP : BlacklistType.DEVICE;

    // 1. Persist to Database
    await this.prisma.blacklist.upsert({
      where: {
        type_value: {
          type: dbType,
          value: target,
        },
      },
      update: {
        isActive: true,
        reason,
        addedBy: 'Compliance Manual',
      },
      create: {
        type: dbType,
        value: target,
        reason,
        addedBy: 'Compliance Manual',
        isActive: true,
      },
    });

    // 2. Sync to Redis for high-performance gateway checks
    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const redisPrefix = type === 'IP' ? 'ip' : 'hw';

    await this.redis.set(`blacklist:${redisPrefix}:${target}`, '1');
    await this.redis.set(`blacklist:reason:${redisPrefix}:${target}`, reason);
    await this.redis.set(`blacklist:date:${redisPrefix}:${target}`, dateStr);
    await this.redis.set(
      `blacklist:by:${redisPrefix}:${target}`,
      'Compliance Manual',
    );
  }

  @Post('blacklist/nodes/unblock')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.AUDITOR)
  async unblockNode(
    @Body() body: { type: 'IP' | 'HARDWARE'; target: string },
  ): Promise<void> {
    const { type, target } = body;
    const dbType = type === 'IP' ? BlacklistType.IP : BlacklistType.DEVICE;

    // 1. Update Database
    await this.prisma.blacklist.update({
      where: {
        type_value: {
          type: dbType,
          value: target,
        },
      },
      data: { isActive: false },
    });

    // 2. Remove from Redis
    const redisPrefix = type === 'IP' ? 'ip' : 'hw';
    await this.redis.del(`blacklist:${redisPrefix}:${target}`);
    await this.redis.del(`blacklist:reason:${redisPrefix}:${target}`);
    await this.redis.del(`blacklist:date:${redisPrefix}:${target}`);
    await this.redis.del(`blacklist:by:${redisPrefix}:${target}`);
  }
}

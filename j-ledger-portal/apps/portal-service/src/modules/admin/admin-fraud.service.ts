import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { IntegrationService } from '../integration/integration.service';
import { INTERNAL_API_PATHS } from '@repo/dto';
import { DisputeStatus, BlacklistType } from '@prisma/client';
import Redis from 'ioredis';
import { REDIS_CLIENT, REDIS_KEYS } from '../../core/common/constants';

@Injectable()
export class AdminFraudService {
  private readonly logger = new Logger(AdminFraudService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationService: IntegrationService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getDisputes(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
    type?: string,
  ) {
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

  async reverseDispute(id: string): Promise<{ success: boolean }> {
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
    await this.redis.set(REDIS_KEYS.ADMIN.DISPUTE_STATUS(id), 'REVERSED');
    await this.redis.set(
      REDIS_KEYS.ADMIN.DISPUTE_UPDATED_AT(id),
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

  // ==================== Dynamic Blacklist Management ====================

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
        severity: 'CRITICAL',
        blacklistedAt: r.createdAt.toISOString().replace('T', ' ').substring(0, 16),
        enforcedBy: r.addedBy || 'Compliance Manual',
        status: r.isActive ? 'ACTIVE' : 'INACTIVE',
      })),
    };
  }

  async blockNode(
    type: 'IP' | 'HARDWARE',
    target: string,
    reason: string,
  ): Promise<void> {
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

    await this.redis.set(REDIS_KEYS.BLACKLIST.BLOCKED(redisPrefix, target), '1');
    await this.redis.set(REDIS_KEYS.BLACKLIST.REASON(redisPrefix, target), reason);
    await this.redis.set(REDIS_KEYS.BLACKLIST.DATE(redisPrefix, target), dateStr);
    await this.redis.set(
      REDIS_KEYS.BLACKLIST.BY(redisPrefix, target),
      'Compliance Manual',
    );
  }

  async unblockNode(type: 'IP' | 'HARDWARE', target: string): Promise<void> {
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
    await this.redis.del(REDIS_KEYS.BLACKLIST.BLOCKED(redisPrefix, target));
    await this.redis.del(REDIS_KEYS.BLACKLIST.REASON(redisPrefix, target));
    await this.redis.del(REDIS_KEYS.BLACKLIST.DATE(redisPrefix, target));
    await this.redis.del(REDIS_KEYS.BLACKLIST.BY(redisPrefix, target));
  }
}

import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { FinanceService } from '../finance.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { INTERNAL_API_PATHS } from '@repo/dto';
import { randomUUID } from 'crypto';

@Injectable()
export class TransactionHistoryService {
  private readonly logger = new Logger(TransactionHistoryService.name);
  private readonly apiGatewayUrl: string;
  private readonly internalSecret: string;

  private static readonly HISTORY_PAGE_DEFAULT = 0;
  private static readonly HISTORY_SIZE_DEFAULT = 20;
  private static readonly HISTORY_SIZE_MAX = 100;

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiGatewayUrl = this.configService.get<string>(
      'FINANCE_SERVICE_URL',
      'http://localhost:8081',
    );
    this.internalSecret = this.configService.get<string>(
      'JLEDGER_INTERNAL_SECRET',
      'default-secret',
    );
  }

  async forwardToGateway<T = any>(
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    data?: unknown,
    customerAccountId?: string,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const url = `${this.apiGatewayUrl}${path}`;
    const headers = {
      'X-Internal-Secret': this.internalSecret,
      ...(customerAccountId && { 'X-Customer-Account-Id': customerAccountId }),
      ...(extraHeaders ?? {}),
    };

    const response = await this.httpService.axiosRef.request<T>({
      method: method.toUpperCase(),
      url,
      data,
      headers,
    });

    return response.data;
  }

  async getHistory(
    userId: string,
    query: {
      page?: number;
      size?: number;
      type?: 'TOPUP' | 'TRANSFER' | 'PAYMENT' | 'WITHDRAWAL';
      q?: string;
      from?: string;
      to?: string;
    },
  ) {
    if (!userId) {
      throw new HttpException(
        { message: 'Unauthorized' },
        HttpStatus.UNAUTHORIZED,
      );
    }
    try {
      const page = Math.max(
        Number(query.page ?? TransactionHistoryService.HISTORY_PAGE_DEFAULT),
        0,
      );
      const size = Math.min(
        Math.max(
          Number(query.size ?? TransactionHistoryService.HISTORY_SIZE_DEFAULT),
          1,
        ),
        TransactionHistoryService.HISTORY_SIZE_MAX,
      );
      const overFetchSize = size * 3;

      const userWallet = await this.financeService.getWallet(userId);
      const userWalletId = userWallet?.walletId;

      const walletTransactions = await this.financeService.getTransactions(
        userId,
        {
          page: 0,
          size: overFetchSize,
          type: query.type,
          from: query.from,
          to: query.to,
        },
      );

      const walletItems = (walletTransactions || []).map((tx: any) =>
        this.mapWalletTransactionToHistoryItem(tx, userWalletId, userWallet?.id),
      );

      const uniqueItems: any[] = [];
      const seenKeys = new Set<string>();

      for (const item of walletItems) {
        const groupKey = item.idempotencyKey || item.reference || item.id;

        if (!seenKeys.has(groupKey)) {
          uniqueItems.push(item);
          seenKeys.add(groupKey);
        }
      }

      const searched = this.applyHistorySearch(uniqueItems, query.q);
      const offset = page * size;
      const pagedItems = searched.slice(offset, offset + size);

      return {
        items: pagedItems,
        page,
        size,
        hasMore: offset + size < searched.length,
      };
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch history';
      this.logger.error(`[History] user=${userId} message="${message}"`);
      throw new HttpException(
        { message },
        error?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getTransactionDetails(transactionId: string, userId?: string) {
    let actualId = transactionId;
    try {
      if (
        transactionId.startsWith('topup_') ||
        transactionId.startsWith('p2p_')
      ) {
        if (transactionId.startsWith('topup_')) {
          const order = await this.prisma.topupOrder.findUnique({
            where: { idempotencyKey: transactionId },
            select: { financeTransactionId: true },
          });
          if (order?.financeTransactionId) {
            actualId = order.financeTransactionId;
          }
        }

        if (actualId === transactionId) {
          const notifications = await this.prisma.notification.findMany({
            where: { referenceId: transactionId },
            select: { metadata: true },
            orderBy: { createdAt: 'desc' },
          });

          for (const notification of notifications) {
            const meta = notification?.metadata as any;
            let resolved =
              meta?.transactionId || meta?.financeTransactionId || meta?.id;

            if (resolved !== undefined && resolved !== null) {
              const resolvedStr = String(resolved);
              if (resolvedStr && !resolvedStr.startsWith('p2p_')) {
                actualId = resolvedStr;
                break;
              }
            }
          }
        }

        if (actualId === transactionId) {
          const auditLog = await this.prisma.auditLog.findFirst({
            where: {
              OR: [
                {
                  requestPayload: {
                    path: ['idempotencyKey'],
                    equals: transactionId,
                  },
                },
                {
                  requestPayload: {
                    path: ['body', 'idempotencyKey'],
                    equals: transactionId,
                  },
                },
              ],
            },
            select: { resourceId: true, changes: true },
            orderBy: { createdAt: 'desc' },
          });

          if (auditLog?.resourceId) {
            actualId = auditLog.resourceId;
          } else if ((auditLog?.changes as any)?.transactionId) {
            actualId = (auditLog.changes as any).transactionId;
          }
        }
      }

      const raw = await this.forwardToGateway(
        'get',
        INTERNAL_API_PATHS.FINANCE.WALLETS.TRANSACTION_DETAIL(actualId),
      );

      let userWalletId: string | undefined;
      let userWalletPk: number | undefined;
      if (userId) {
        try {
          const wallet = await this.financeService.getWallet(userId);
          userWalletId = wallet?.walletId;
          userWalletPk = wallet?.id;
        } catch {}
      }

      return this.mapWalletTransactionToHistoryItem(raw, userWalletId, userWalletPk);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      this.logger.error(
        `[TransactionDetails] Failed for ID ${transactionId} (actual: ${actualId}): ${errorMsg}`,
      );

      throw new HttpException(
        {
          message: 'ไม่พบรายละเอียดธุรกรรม หรือรหัสอ้างอิงไม่ถูกต้อง',
          debug: {
            originalId: transactionId,
            resolvedId: actualId,
            error: errorMsg,
          },
        },
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // History Helpers
  private formatTransactionTitle(tx: any, isIncome: boolean): string {
    const type = tx.type || tx.transactionType;
    const metadata = this.parseMetadata(tx.metadata);
    const amount = Number(metadata.totalAmount || tx.amount || 0).toFixed(2);

    switch (type) {
      case 'TOPUP':
        return `Top up ${amount}฿ to wallet`;
      case 'PAYMENT':
      case 'MERCHANT_PAYMENT': {
        const merchant =
          metadata.merchantName || metadata.merchant_name || 'Merchant';
        return `Purchase ${amount}฿ to ${merchant}`;
      }
      case 'TRANSFER': {
        if (isIncome) {
          const sender = metadata.senderPhone || '0xx-xxx-xxxx';
          return `Receive ${amount}฿ from ${this.maskPhone(sender)}`;
        } else {
          const recipient = metadata.recipientPhone || '0xx-xxx-xxxx';
          return `Transfer ${amount}฿ to ${this.maskPhone(recipient)}`;
        }
      }
      case 'WITHDRAWAL':
        return `Withdraw ${amount}฿ from wallet`;
      default:
        return tx.description || 'Other Transaction';
    }
  }

  private parseMetadata(raw: unknown): Record<string, any> {
    const parsed = (() => {
      if (!raw) return {};
      if (typeof raw === 'object') return raw as Record<string, any>;
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch {
          return {};
        }
      }
      return {};
    })();

    if (parsed.extra && typeof parsed.extra === 'string') {
      try {
        const extra = JSON.parse(parsed.extra);
        return { ...parsed, ...extra };
      } catch {
        // ignore
      }
    }
    return parsed;
  }

  mapWalletTransactionToHistoryItem(
    tx: any,
    userWalletId?: string | number,
    userWalletPk?: string | number,
  ) {
    const type = (tx?.type || tx?.transactionType || 'PAYMENT') as
      | 'TOPUP'
      | 'TRANSFER'
      | 'PAYMENT'
      | 'MERCHANT_PAYMENT'
      | 'WITHDRAWAL';
    const metadata = this.parseMetadata(tx?.metadata);

    const isIncome = userWalletId || userWalletPk
      ? (userWalletId && String(tx.toWalletId) === String(userWalletId)) ||
        (userWalletPk && String(tx.toWalletId) === String(userWalletPk))
      : type === 'TOPUP' || (!tx?.fromWalletId && !!tx?.toWalletId);

    const createdAt = tx?.createdAt
      ? new Date(tx.createdAt).toISOString()
      : new Date().toISOString();

    const rawAmount = Number(tx?.amount || 0);
    const grossAmount = Number(metadata.totalAmount || rawAmount);

    const isPayment = type === 'PAYMENT' || type === 'MERCHANT_PAYMENT';
    const displayNetAmount = isPayment ? grossAmount : rawAmount;
    const feeAmount = isPayment ? 0 : grossAmount - rawAmount;

    return {
      id: tx?.transactionId || String(tx?.id || randomUUID()),
      type,
      title: this.formatTransactionTitle(tx, isIncome),
      description: tx?.description || undefined,
      amount: grossAmount.toFixed(2),
      netAmount: displayNetAmount.toFixed(2),
      feeAmount: feeAmount > 0 ? feeAmount.toFixed(2) : undefined,
      currency: tx?.currency || 'THB',
      direction: isIncome ? 'IN' : 'OUT',
      status: tx?.status === 'FAILED' ? 'FAILED' : 'COMPLETED',
      createdAt,
      source: 'WALLET_TXN' as const,
      provider: metadata.provider || undefined,
      paymentIntentId: metadata.paymentIntentId || undefined,
      orderId: metadata.orderId || undefined,
      reference: tx?.transactionId || undefined,
      idempotencyKey:
        metadata.idempotencyKey || tx?.idempotencyKey || undefined,
    };
  }

  private applyHistorySearch(items: any[], query?: string) {
    if (!query || !query.trim()) {
      return items;
    }
    const q = query.trim().toLowerCase();
    return items.filter((item) =>
      [
        item.title,
        item.subtitle,
        item.reference,
        item.paymentIntentId,
        item.orderId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }

  private maskPhone(phone: string) {
    if (!phone || phone.length < 6) {
      return phone;
    }
    return `${phone.slice(0, 3)}-***-${phone.slice(-3)}`;
  }

  async getAccountByUserId(userId: string) {
    const accounts = await this.forwardToGateway(
      'get',
      INTERNAL_API_PATHS.FINANCE.ACCOUNTS.USER(userId),
    );
    return { data: accounts[0] };
  }

  async get(path: string) {
    const response = await this.forwardToGateway('get', path);
    return { data: response };
  }
}

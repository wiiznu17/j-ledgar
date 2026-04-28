import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceService } from './finance.service';
import Stripe from 'stripe';
import { TopupOrderStatus } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';

@Injectable()
export class IntegrationService {
  private readonly apiGatewayUrl: string;
  private readonly internalSecret: string;

  private readonly logger = new Logger(IntegrationService.name);
  private readonly stripe: any;

  private static readonly HISTORY_PAGE_DEFAULT = 0;
  private static readonly HISTORY_SIZE_DEFAULT = 20;
  private static readonly HISTORY_SIZE_MAX = 100;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
  ) {
    this.apiGatewayUrl = this.configService.get<string>('API_GATEWAY_URL', 'http://localhost:8080');
    this.internalSecret = this.configService.get<string>(
      'JLEDGER_INTERNAL_SECRET',
      'default-secret',
    );
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY', '');
    this.stripe = new Stripe(stripeSecretKey);
  }

  // ==================== Ledger Proxy ====================

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

  async getAccountByUserId(userId: string) {
    const accounts = await this.forwardToGateway('get', `/api/v1/accounts/user/${userId}`);
    return { data: accounts[0] };
  }

  async get(path: string) {
    const response = await this.forwardToGateway('get', path);
    return { data: response };
  }

  // ==================== Transaction History ====================

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
      throw new HttpException({ message: 'Unauthorized' }, HttpStatus.UNAUTHORIZED);
    }
    try {
      const startedAt = Date.now();
      const page = Math.max(Number(query.page ?? IntegrationService.HISTORY_PAGE_DEFAULT), 0);
      const size = Math.min(
        Math.max(Number(query.size ?? IntegrationService.HISTORY_SIZE_DEFAULT), 1),
        IntegrationService.HISTORY_SIZE_MAX,
      );
      const overFetchSize = size * 3;

      const walletTransactions = await this.financeService.getTransactions(userId, {
        page: 0,
        size: overFetchSize,
        type: query.type,
        from: query.from,
        to: query.to,
      });

      const walletItems = (walletTransactions || []).map((tx: any) =>
        this.mapWalletTransactionToHistoryItem(tx),
      );
      const searched = this.applyHistorySearch(walletItems, query.q);
      const offset = page * size;
      const pagedItems = searched.slice(offset, offset + size);

      this.logger.log(
        `[HistoryDebug] user=${userId} type=${query.type || 'ALL'} page=${page} size=${size} walletRaw=${(walletTransactions || []).length} walletMapped=${walletItems.length} searched=${searched.length} returned=${pagedItems.length} hasMore=${offset + size < searched.length} elapsedMs=${Date.now() - startedAt}`,
      );

      return {
        items: pagedItems,
        page,
        size,
        hasMore: offset + size < searched.length,
      };
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to fetch history';
      this.logger.error(`[History] user=${userId} message="${message}"`);
      throw new HttpException({ message }, error?.status || HttpStatus.BAD_GATEWAY);
    }
  }

  async getTransactionDetails(transactionId: string) {
    return this.forwardToGateway('get', `/api/v1/transactions/${transactionId}`);
  }

  // ==================== Bank Integration ====================

  async getBankIntegrations() {
    // TODO: Return bank integrations from Prisma
    return [];
  }

  async createBankIntegration(data: any) {
    // TODO: Create bank integration in Prisma
    return { success: true };
  }

  async updateBankIntegration(id: string, data: any) {
    // TODO: Update bank integration in Prisma
    return { success: true };
  }

  async deleteBankIntegration(id: string) {
    // TODO: Delete bank integration from Prisma
    return { success: true };
  }

  // ==================== Webhooks ====================

  async createWebhook(data: any) {
    // TODO: Create webhook in Prisma
    return { success: true };
  }

  async getWebhooks() {
    // TODO: Return webhooks from Prisma
    return [];
  }

  async deleteWebhook(id: string) {
    // TODO: Delete webhook from Prisma
    return { success: true };
  }
  // ==================== Dashboard BFF ====================

  async getDashboardData(userId: string) {
    this.logger.log(`[Dashboard] Fetching dashboard data for user ${userId}`);

    // Fetch data in parallel for performance
    const [kycData, wallet, transactions] = await Promise.all([
      this.prisma.kYCData.findUnique({ where: { userId } }).catch(() => null),
      this.financeService.getWallet(userId).catch(() => null),
      this.financeService.getTransactions(userId).catch(() => []),
    ]);

    // Format recent transactions for the frontend
    const recentTransactions = (transactions || []).slice(0, 10).map((tx: any) => ({
      id: tx.transactionId || tx.id?.toString(),
      title: this.formatTransactionTitle(tx),
      category: tx.type || 'OTHER',
      amount: Math.abs(tx.amount || 0),
      type: tx.type === 'TOPUP' ? 'income' : 'expense',
      time: tx.createdAt
        ? new Date(tx.createdAt).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' })
        : '',
    }));

    return {
      user: {
        id: userId,
        name: kycData?.idCardName || 'J-Ledger User',
        kycStatus: kycData?.verificationStatus || 'NOT_STARTED',
      },
      wallet: wallet
        ? {
            balance: wallet.balance || 0,
            currency: wallet.currency || 'THB',
            status: wallet.status || 'ACTIVE',
            walletId: wallet.walletId,
          }
        : null,
      recentTransactions,
    };
  }

  async getLinkedBankAccounts(userId: string) {
    const accounts = await this.financeService.getLinkedBankAccounts(userId);
    return (accounts || []).map((account: any) => ({
      id: account.id,
      bankCode: account.bankCode,
      bankName: account.bankName,
      accountNumberMasked: account.accountNumber,
      accountName: account.accountName,
      accountType: account.accountType,
      isDefault: account.isDefault,
      isVerified: account.isVerified,
    }));
  }

  async topUp(userId: string, amount: number, bankAccountId: number) {
    const tx = await this.financeService.topUp(userId, amount, bankAccountId);

    const bankAccounts = await this.financeService.getLinkedBankAccounts(userId);
    const linkedBank = bankAccounts.find((account: any) => account.id === bankAccountId);

    return {
      transactionId: tx.transactionId || tx.id?.toString(),
      amount: tx.amount,
      status: tx.status,
      createdAt: tx.createdAt,
      bankName: linkedBank?.bankName || null,
      accountNumberMasked: linkedBank?.accountNumber || null,
      metadata: tx.metadata || null,
    };
  }

  async createStripeTopupIntent(userId: string, amount: number, currency: string = 'THB') {
    if (!amount || amount <= 0) {
      throw new Error('Invalid top-up amount');
    }

    const normalizedCurrency = currency.toLowerCase();
    const amountMinor = Math.round(amount * 100);
    const idempotencyKey = `topup_${userId}_${randomUUID()}`;

    const order = await this.prisma.topupOrder.create({
      data: {
        userId,
        amount: amount.toFixed(4),
        currency: currency.toUpperCase(),
        status: TopupOrderStatus.PENDING,
        idempotencyKey,
      },
    });

    const paymentIntent = await this.stripe.paymentIntents.create(
      {
        amount: amountMinor,
        currency: normalizedCurrency,
        metadata: {
          userId,
          orderId: order.id,
        },
      },
      {
        idempotencyKey,
      },
    );

    await this.prisma.topupOrder.update({
      where: { id: order.id },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        clientSecretRef: paymentIntent.client_secret || '',
      },
    });

    return {
      orderId: order.id,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      publishableKey: this.configService.get<string>('STRIPE_PUBLISHABLE_KEY', ''),
    };
  }

  async getTopupOrderStatus(userId: string, orderId: string) {
    const order = await this.prisma.topupOrder.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) {
      throw new Error('Top-up order not found');
    }
    return {
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      transactionId: order.financeTransactionId || order.id,
      createdAt: order.updatedAt,
    };
  }

  async previewP2PTransfer(userId: string, body: { recipientPhone: string; amount: number }) {
    const recipientPhone = this.normalizePhone(body.recipientPhone);
    const amount = Number(body.amount || 0);
    if (amount <= 0) {
      throw new HttpException(
        { message: 'Amount must be greater than zero' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const preview = await this.financeService.previewP2PTransfer(userId, {
        recipientPhone,
        amount: amount.toFixed(4),
      });

      const recipientUserId = preview?.recipient?.userId;
      const recipientProfile = recipientUserId
        ? await this.prisma.kYCData
            .findUnique({ where: { userId: recipientUserId } })
            .catch(() => null)
        : null;

      this.logger.log(
        `[P2PPreview] user=${userId} recipientHash=${this.hashPhone(recipientPhone)} amount=${amount.toFixed(2)} outcome=success`,
      );

      return {
        recipient: {
          userId: recipientUserId,
          phoneMasked: preview?.recipient?.phoneMasked || this.maskPhone(recipientPhone),
          displayName: recipientProfile?.idCardName || null,
        },
        amount: preview?.amount ?? amount.toFixed(4),
        fee: preview?.fee ?? '0.0000',
        totalDebit: preview?.totalDebit ?? amount.toFixed(4),
        currency: preview?.currency ?? 'THB',
      };
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || 'Failed to preview transfer';
      this.logger.error(
        `[P2PPreview] user=${userId} recipientHash=${this.hashPhone(recipientPhone)} amount=${amount.toFixed(2)} outcome=failed message="${message}"`,
      );
      throw new HttpException({ message }, error?.status || HttpStatus.BAD_GATEWAY);
    }
  }

  async transferP2P(
    userId: string,
    body: { recipientPhone: string; amount: number; note?: string; idempotencyKey: string },
  ) {
    const recipientPhone = this.normalizePhone(body.recipientPhone);
    const amount = Number(body.amount || 0);
    if (amount <= 0) {
      throw new HttpException(
        { message: 'Amount must be greater than zero' },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!body.idempotencyKey) {
      throw new HttpException({ message: 'idempotencyKey is required' }, HttpStatus.BAD_REQUEST);
    }

    try {
      const tx = await this.financeService.transferByPhone(userId, {
        recipientPhone,
        amount: amount.toFixed(4),
        note: body.note,
        idempotencyKey: body.idempotencyKey,
      });

      const metadata = this.parseMetadata(tx?.metadata);
      const recipientUserId = metadata?.recipientUserId;
      const recipientProfile = recipientUserId
        ? await this.prisma.kYCData
            .findUnique({ where: { userId: recipientUserId } })
            .catch(() => null)
        : null;

      this.logger.log(
        `[P2PTransfer] user=${userId} recipientHash=${this.hashPhone(recipientPhone)} amount=${amount.toFixed(2)} outcome=success txn=${tx?.transactionId || tx?.id}`,
      );

      return {
        transactionId: tx?.transactionId || tx?.id?.toString(),
        status: tx?.status || 'COMPLETED',
        amount: Number(tx?.amount || amount).toFixed(4),
        fee: '0.0000',
        totalDebit: Number(tx?.amount || amount).toFixed(4),
        currency: 'THB',
        recipient: {
          userId: recipientUserId || null,
          phoneMasked: this.maskPhone(recipientPhone),
          displayName: recipientProfile?.idCardName || null,
        },
        createdAt: tx?.createdAt || new Date().toISOString(),
      };
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to transfer';
      this.logger.error(
        `[P2PTransfer] user=${userId} recipientHash=${this.hashPhone(recipientPhone)} amount=${amount.toFixed(2)} outcome=failed message="${message}"`,
      );
      throw new HttpException({ message }, error?.status || HttpStatus.BAD_GATEWAY);
    }
  }

  async processStripeWebhook(signature: string | undefined, rawBody: Buffer) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET', '');
    if (!signature) {
      throw new Error('Missing stripe signature');
    }

    const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    this.logger.log(`[StripeWebhook] event=${event.type} id=${event.id}`);
    if (event.type === 'payment_intent.succeeded') {
      await this.handlePaymentIntentSucceeded(event);
    }

    if (
      event.type === 'payment_intent.payment_failed' ||
      event.type === 'payment_intent.canceled'
    ) {
      await this.handlePaymentIntentFailed(event);
    }

    return { received: true };
  }

  private async handlePaymentIntentSucceeded(event: any) {
    const paymentIntent = event.data.object as any;
    const paymentIntentId = paymentIntent.id;

    const order = await this.prisma.topupOrder.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });
    if (!order) {
      this.logger.warn(`[StripeWebhook] missing order for paymentIntent=${paymentIntentId}`);
      return;
    }

    if (order.status === TopupOrderStatus.PAID) {
      return;
    }
    if (order.status === TopupOrderStatus.PROCESSING && order.processedEventId === event.id) {
      return;
    }

    await this.prisma.topupOrder.update({
      where: { id: order.id },
      data: { status: TopupOrderStatus.PROCESSING, processedEventId: event.id },
    });

    let creditResult: any;
    try {
      creditResult = await this.financeService.creditStripeTopUp(order.userId, {
        amount: Number(order.amount).toFixed(4),
        currency: order.currency,
        externalRef: paymentIntentId,
        provider: 'STRIPE',
        metadata: {
          provider: 'STRIPE',
          paymentIntentId,
          orderId: order.id,
        },
      });
    } catch (error: any) {
      this.logger.error(
        `[StripeWebhook] credit failed order=${order.id} paymentIntent=${paymentIntentId} message="${error?.message || 'unknown'}"`,
      );
      await this.prisma.topupOrder.update({
        where: { id: order.id },
        data: {
          status: TopupOrderStatus.FAILED,
          processedEventId: event.id,
        },
      });
      throw error;
    }

    await this.prisma.topupOrder.update({
      where: { id: order.id },
      data: {
        status: TopupOrderStatus.PAID,
        financeTransactionId: creditResult?.transactionId ?? null,
        processedEventId: event.id,
      },
    });
  }

  private async handlePaymentIntentFailed(event: any) {
    const paymentIntent = event.data.object as any;
    const paymentIntentId = paymentIntent.id;

    const order = await this.prisma.topupOrder.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });
    if (!order || order.status === TopupOrderStatus.PAID) {
      return;
    }

    const failedStatus =
      event.type === 'payment_intent.canceled'
        ? TopupOrderStatus.CANCELED
        : TopupOrderStatus.FAILED;

    await this.prisma.topupOrder.update({
      where: { id: order.id },
      data: { status: failedStatus, processedEventId: event.id },
    });
  }

  private formatTransactionTitle(tx: any): string {
    switch (tx.type) {
      case 'TOPUP':
        return 'เติมเงินเข้าบัญชี';
      case 'PAYMENT':
        return 'ชำระเงิน';
      case 'TRANSFER':
        return 'โอนเงิน';
      case 'WITHDRAWAL':
        return 'ถอนเงิน';
      default:
        return tx.description || 'ธุรกรรมอื่นๆ';
    }
  }

  private parseMetadata(raw: unknown): Record<string, any> {
    if (!raw) {
      return {};
    }
    if (typeof raw === 'object') {
      return raw as Record<string, any>;
    }
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    return {};
  }

  private mapWalletTransactionToHistoryItem(tx: any) {
    const kind = (tx?.type || 'PAYMENT') as 'TOPUP' | 'TRANSFER' | 'PAYMENT' | 'WITHDRAWAL';
    const metadata = this.parseMetadata(tx?.metadata);
    const isIncome = kind === 'TOPUP' || (!tx?.fromWalletId && !!tx?.toWalletId);
    const occurredAt = tx?.createdAt
      ? new Date(tx.createdAt).toISOString()
      : new Date().toISOString();
    const amount = Number(tx?.amount || 0);

    return {
      id: tx?.transactionId || String(tx?.id || randomUUID()),
      kind,
      title: this.formatTransactionTitle(tx),
      subtitle: tx?.description || undefined,
      amount: amount.toFixed(2),
      currency: 'THB',
      direction: isIncome ? 'IN' : 'OUT',
      status: tx?.status === 'FAILED' ? 'FAILED' : 'COMPLETED',
      occurredAt,
      source: 'WALLET_TXN' as const,
      provider: metadata.provider || undefined,
      paymentIntentId: metadata.paymentIntentId || undefined,
      orderId: metadata.orderId || undefined,
      reference: tx?.transactionId || undefined,
    };
  }

  private applyHistorySearch(items: any[], query?: string) {
    if (!query || !query.trim()) {
      return items;
    }
    const q = query.trim().toLowerCase();
    return items.filter((item) =>
      [item.title, item.subtitle, item.reference, item.paymentIntentId, item.orderId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }

  private normalizePhone(phone: string) {
    const digits = (phone || '').replace(/\D/g, '');
    if (digits.length === 9) {
      return `0${digits}`;
    }
    return digits;
  }

  private maskPhone(phone: string) {
    if (!phone || phone.length < 6) {
      return phone;
    }
    return `${phone.slice(0, 3)}-***-${phone.slice(-3)}`;
  }

  private hashPhone(phone: string) {
    return createHash('sha256')
      .update(phone || '')
      .digest('hex')
      .slice(0, 10);
  }
}

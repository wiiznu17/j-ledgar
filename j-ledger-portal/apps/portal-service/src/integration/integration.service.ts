import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { FinanceService } from './finance.service';
import Stripe from 'stripe';
import { TopupOrderStatus } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { BillingService } from '../billing/billing.service';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class IntegrationService {
  private readonly apiGatewayUrl: string;
  private readonly internalSecret: string;

  private readonly logger = new Logger(IntegrationService.name);
  private readonly stripe: any | null;

  private static readonly HISTORY_PAGE_DEFAULT = 0;
  private static readonly HISTORY_SIZE_DEFAULT = 20;
  private static readonly HISTORY_SIZE_MAX = 100;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
    @Inject(forwardRef(() => BillingService))
    private readonly billingService: BillingService,
  ) {
    this.apiGatewayUrl = this.configService.get<string>('FINANCE_SERVICE_URL', 'http://localhost:8081');
    this.internalSecret = this.configService.get<string>(
      'JLEDGER_INTERNAL_SECRET',
      'default-secret',
    );
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY', '');
    if (!stripeSecretKey) {
      this.logger.warn('STRIPE_SECRET_KEY is not set; Stripe features are disabled.');
      this.stripe = null;
    } else {
      this.stripe = new Stripe(stripeSecretKey);
    }
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
    let actualId = transactionId;
    try {
      if (transactionId.startsWith('topup_') || transactionId.startsWith('p2p_')) {
        
        // Strategy A: Check TopupOrder table
        if (transactionId.startsWith('topup_')) {
          const order = await this.prisma.topupOrder.findUnique({
            where: { idempotencyKey: transactionId },
            select: { financeTransactionId: true }
          });
          if (order?.financeTransactionId) {
            actualId = order.financeTransactionId;
          }
        }

        // Strategy B: Check Notification Metadata (Most reliable for existing ones)
        if (actualId === transactionId) {
          const notifications = await this.prisma.notification.findMany({
            where: { referenceId: transactionId },
            select: { metadata: true },
            orderBy: { createdAt: 'desc' }
          });
          
          for (const notification of notifications) {
            const meta = notification?.metadata as any;
            let resolved = meta?.transactionId || meta?.financeTransactionId || meta?.id;
            
            if (resolved !== undefined && resolved !== null) {
              const resolvedStr = String(resolved);
              if (resolvedStr && !resolvedStr.startsWith('p2p_')) {
                actualId = resolvedStr;
                break;
              }
            }
          }
        }

        // Strategy C: Check AuditLogs (as fallback)
        if (actualId === transactionId) {
          const auditLog = await this.prisma.auditLog.findFirst({
            where: {
              OR: [
                { requestPayload: { path: ['idempotencyKey'], equals: transactionId } },
                { requestPayload: { path: ['body', 'idempotencyKey'], equals: transactionId } }
              ]
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
      // 2. Fetch from Finance Gateway (Correct Path: /api/finance/wallets/transactions/:id)
      const raw = await this.forwardToGateway('get', `/api/finance/wallets/transactions/${actualId}`);
      return this.mapWalletTransactionToHistoryItem(raw);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      this.logger.error(`[TransactionDetails] Failed for ID ${transactionId} (actual: ${actualId}): ${errorMsg}`);
      
      throw new HttpException(
        { 
          message: 'ไม่พบรายละเอียดธุรกรรม หรือรหัสอ้างอิงไม่ถูกต้อง',
          debug: { originalId: transactionId, resolvedId: actualId, error: errorMsg }
        },
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
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

    // Format recent transactions for the frontend using unified mapping
    const recentTransactions = (transactions || []).slice(0, 10).map((tx: any) => 
      this.mapWalletTransactionToHistoryItem(tx)
    );

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
    if (!this.stripe) {
      throw new HttpException(
        { message: 'Stripe is not configured' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
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

    // Verify recipient exists in system before calling finance service
    const recipientUser = await this.findUserByPhone(recipientPhone);
    if (!recipientUser) {
      this.logger.warn(
        `[P2PPreview] user=${userId} recipientHash=${this.hashPhone(recipientPhone)} outcome=recipient_not_found`,
      );
      throw new HttpException(
        { message: 'Recipient not found. This phone number is not registered in the system.' },
        HttpStatus.NOT_FOUND,
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
      // Map finance service "Recipient not found" to 404
      if (message.toLowerCase().includes('recipient not found')) {
        throw new HttpException(
          { message: 'Recipient not found. This phone number is not registered in the system.' },
          HttpStatus.NOT_FOUND,
        );
      }
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

    // Verify recipient exists in system before calling finance service
    const recipientUser = await this.findUserByPhone(recipientPhone);
    if (!recipientUser) {
      this.logger.warn(
        `[P2PTransfer] user=${userId} recipientHash=${this.hashPhone(recipientPhone)} outcome=recipient_not_found`,
      );
      throw new HttpException(
        { message: 'Recipient not found. This phone number is not registered in the system.' },
        HttpStatus.NOT_FOUND,
      );
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

      const finalTxId = tx?.transactionId || tx?.id?.toString();

      // Log to AuditLog for future resolution
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'P2P_TRANSFER',
          resourceType: 'TRANSACTION',
          resourceId: finalTxId,
          requestPayload: { ...body },
          changes: { transactionId: finalTxId },
          responseStatus: 200,
        }
      }).catch(err => this.logger.error(`[P2PTransfer] Audit logging failed: ${err.message}`));

      this.logger.log(
        `[P2PTransfer] user=${userId} recipientHash=${this.hashPhone(recipientPhone)} amount=${amount.toFixed(2)} outcome=success txn=${finalTxId}`,
      );

      const result = {
        transactionId: finalTxId,
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

      // Create Invoice after successful transfer
      try {
        await this.billingService.createInvoice({
          userId,
          senderName: 'J-Ledger Wallet',
          note: body.note,
          referenceId: finalTxId,
          items: [
            {
              name: `P2P Transfer to ${recipientProfile?.idCardName || recipientPhone}`,
              quantity: 1,
              unitPrice: amount
            }
          ]
        });
      } catch (err) {
        this.logger.error(`[P2PTransfer] Invoice creation failed: ${err.message}`);
      }

      return result;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to transfer';
      this.logger.error(
        `[P2PTransfer] user=${userId} recipientHash=${this.hashPhone(recipientPhone)} amount=${amount.toFixed(2)} outcome=failed message="${message}"`,
      );
      // Map finance service "Recipient not found" to 404
      if (message.toLowerCase().includes('recipient not found')) {
        throw new HttpException(
          { message: 'Recipient not found. This phone number is not registered in the system.' },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException({ message }, error?.status || HttpStatus.BAD_GATEWAY);
    }
  }

  async processStripeWebhook(signature: string | undefined, rawBody: Buffer) {
    if (!this.stripe) {
      throw new HttpException(
        { message: 'Stripe is not configured' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
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
    this.logger.log(`[StripeWebhook] Processing successful payment: ${paymentIntentId}`);

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

    // Create Invoice after successful Top-up
    this.logger.log(`[StripeWebhook] Triggering invoice creation for order=${order.id} user=${order.userId}`);
    try {
      await this.billingService.createInvoice({
        userId: order.userId,
        senderName: 'J-Ledger Top-up',
        note: `Top-up via ${order.currency}`,
        referenceId: paymentIntentId,
        items: [
          {
            name: `Wallet Top-up (${order.currency})`,
            quantity: 1,
            unitPrice: Number(order.amount)
          }
        ]
      });
    } catch (err) {
      this.logger.error(`[StripeWebhook] Invoice creation failed: ${err.message}`);
    }
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
    const type = (tx?.type || 'PAYMENT') as 'TOPUP' | 'TRANSFER' | 'PAYMENT' | 'WITHDRAWAL';
    const metadata = this.parseMetadata(tx?.metadata);
    const isIncome = type === 'TOPUP' || (!tx?.fromWalletId && !!tx?.toWalletId);
    const createdAt = tx?.createdAt
      ? new Date(tx.createdAt).toISOString()
      : new Date().toISOString();
    const amount = Number(tx?.amount || 0);

    return {
      id: tx?.transactionId || String(tx?.id || randomUUID()),
      type,
      title: this.formatTransactionTitle(tx),
      description: tx?.description || undefined,
      amount: amount.toFixed(2),
      currency: tx?.currency || 'THB',
      direction: isIncome ? 'IN' : 'OUT',
      status: tx?.status === 'FAILED' ? 'FAILED' : 'COMPLETED',
      createdAt,
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

  private getPhoneCandidates(phone: string): string[] {
    const digits = (phone || '').replace(/\D/g, '');
    const candidates = [phone];
    // Local Thai format (0xxxxxxxx)
    if (digits.length === 10 && digits.startsWith('0')) {
      candidates.push(digits);
      candidates.push(`+66${digits.slice(1)}`);
    }
    // E.164 format (+66xxxxxxxx)
    if (digits.length === 11 && digits.startsWith('66')) {
      candidates.push(`+${digits}`);
      candidates.push(`0${digits.slice(2)}`);
    }
    return [...new Set(candidates)];
  }

  private async findUserByPhone(phone: string) {
    const candidates = this.getPhoneCandidates(phone);
    return this.prisma.user.findFirst({
      where: { phoneNumber: { in: candidates } },
    });
  }
}

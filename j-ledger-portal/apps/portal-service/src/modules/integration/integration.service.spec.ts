import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationService } from './integration.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { FinanceService } from '../../core/finance/finance.service';
import { BillingService } from '../billing/billing.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { BannerService } from '../banners/banner.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  createMockPrismaService,
  createMockFinanceService,
  createMockConfigService,
  createMockHttpService,
  createMockBannerService,
} from '../../__tests__/test-utils';
import { TopupOrderStatus } from '@prisma/client';
import { HttpException, HttpStatus } from '@nestjs/common';
import Stripe from 'stripe';
import { REDIS_CLIENT } from '../../core/common/constants';
import { FraudService } from '../fraud/fraud.service';
import { StripeIntegrationService } from './services/stripe-integration.service';
import { P2PTransferService } from './services/p2p-transfer.service';
import { TransactionHistoryService } from './services/transaction-history.service';
import { DashboardBffService } from './services/dashboard-bff.service';
import { BankIntegrationService } from './services/bank-integration.service';
import { WebhookConfigService } from './services/webhook-config.service';
import { StatementExportService } from './services/statement-export.service';

const mockStripeInstance: any = {
  balance: {
    retrieve: jest.fn(),
  },
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripeInstance);
});

describe('IntegrationService', () => {
  let service: IntegrationService;
  let stripeService: StripeIntegrationService;
  let historyService: TransactionHistoryService;
  let prisma: any;
  let financeService: any;
  let billingService: any;
  let loyaltyService: any;
  let bannerService: any;
  let httpService: any;
  let configService: any;
  let fraudService: any;
  let redis: any;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    financeService = createMockFinanceService();
    billingService = {
      createInvoice: jest.fn(),
    };
    loyaltyService = {
      getUserBalance: jest.fn(),
      earnPoints: jest.fn(),
    };
    bannerService = createMockBannerService();
    httpService = createMockHttpService();
    configService = createMockConfigService({
      STRIPE_SECRET_KEY: 'sk_test_mock',
      FINANCE_SERVICE_URL: 'http://localhost:8081',
      JLEDGER_INTERNAL_SECRET: 'mock_internal_secret',
    });
    fraudService = {
      evaluateTransaction: jest.fn().mockResolvedValue({ action: 'ALLOW' }),
    };
    redis = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationService,
        StripeIntegrationService,
        P2PTransferService,
        TransactionHistoryService,
        DashboardBffService,
        BankIntegrationService,
        WebhookConfigService,
        StatementExportService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: FinanceService,
          useValue: financeService,
        },
        {
          provide: BillingService,
          useValue: billingService,
        },
        {
          provide: LoyaltyService,
          useValue: loyaltyService,
        },
        {
          provide: BannerService,
          useValue: bannerService,
        },
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: FraudService,
          useValue: fraudService,
        },
        {
          provide: REDIS_CLIENT,
          useValue: redis,
        },
      ],
    }).compile();

    service = module.get<IntegrationService>(IntegrationService);
    stripeService = module.get<StripeIntegrationService>(StripeIntegrationService);
    historyService = module.get<TransactionHistoryService>(TransactionHistoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStripeBalance', () => {
    it('should return available and pending Stripe balances converted from cents to THB', async () => {
      mockStripeInstance.balance.retrieve.mockResolvedValue({
        available: [{ currency: 'thb', amount: 15000 }], // 150.00 THB
        pending: [{ currency: 'thb', amount: 3500 }],   // 35.00 THB
      });

      const result = await service.getStripeBalance();

      expect(mockStripeInstance.balance.retrieve).toHaveBeenCalled();
      expect(result).toEqual({
        available: 150,
        pending: 35,
      });
    });

    it('should return null when Stripe balance API fails', async () => {
      mockStripeInstance.balance.retrieve.mockRejectedValue(new Error('Stripe API Error'));

      const result = await service.getStripeBalance();

      expect(result).toBeNull();
    });
  });

  describe('forwardToGateway', () => {
    it('should forward request to API gateway with internal headers', async () => {
      httpService.axiosRef.request.mockResolvedValue({ data: { ok: true } });

      const result = await service.forwardToGateway('post', '/api/v1/accounts', { balance: 100 }, 'acc-123', { 'Custom-Header': 'val' });

      expect(httpService.axiosRef.request).toHaveBeenCalledWith({
        method: 'POST',
        url: 'http://localhost:8081/api/v1/accounts',
        data: { balance: 100 },
        headers: {
          'X-Internal-Secret': 'mock_internal_secret',
          'X-Customer-Account-Id': 'acc-123',
          'Custom-Header': 'val',
        },
      });

      expect(result).toEqual({ ok: true });
    });
  });

  describe('getHistory', () => {
    it('should retrieve transactions, deduplicate by idempotencyKey, and return correct page list', async () => {
      financeService.getWallet.mockResolvedValue({ id: 1, walletId: 'W1' });
      financeService.getTransactions.mockResolvedValue([
        {
          id: 'tx-1',
          transactionType: 'TRANSFER',
          amount: 200,
          fromWalletId: 'W1',
          toWalletId: 'W2',
          idempotencyKey: 'p2p_key_1',
          createdAt: '2026-01-01T12:00:00Z',
        },
        {
          id: 'tx-2',
          transactionType: 'TRANSFER',
          amount: 200,
          fromWalletId: 'W1',
          toWalletId: 'W2',
          idempotencyKey: 'p2p_key_1', // duplicate leg/key
          createdAt: '2026-01-01T12:00:00Z',
        },
        {
          id: 'tx-3',
          transactionType: 'TOPUP',
          amount: 1000,
          toWalletId: 'W1',
          idempotencyKey: 'topup_key_2',
          createdAt: '2026-01-02T12:00:00Z',
        },
      ]);

      const result = await service.getHistory('user-1', { page: 0, size: 5 });

      expect(result.items).toHaveLength(2); // deduped to 2 items
      expect(result.items[0].id).toBe('tx-1');
      expect(result.items[1].id).toBe('tx-3');
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getTransactionDetails', () => {
    it('should check TopupOrder table for idempotencyKey and fallback to finance-service', async () => {
      prisma.topupOrder.findUnique.mockResolvedValue({
        financeTransactionId: 'txn-stripe-real-id',
      });

      httpService.axiosRef.request.mockResolvedValue({
        data: {
          id: 'txn-stripe-real-id',
          transactionType: 'TOPUP',
          amount: 500,
          toWalletId: 'W1',
        },
      });

      const result = await service.getTransactionDetails('topup_key_123', 'user-1');

      expect(prisma.topupOrder.findUnique).toHaveBeenCalledWith({
        where: { idempotencyKey: 'topup_key_123' },
        select: { financeTransactionId: true },
      });

      expect(httpService.axiosRef.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'http://localhost:8081/api/finance/wallets/transactions/txn-stripe-real-id',
        }),
      );

      expect(result.id).toBe('txn-stripe-real-id');
    });
  });

  describe('createStripeTopupIntent', () => {
    it('should create topupOrder in DB, call Stripe API, and update order with intent ID', async () => {
      prisma.topupOrder.create.mockResolvedValue({ id: 'order-1' });
      mockStripeInstance.paymentIntents.create.mockResolvedValue({
        id: 'pi_test_intent_id',
        client_secret: 'secret_stripe_intent',
      });
      financeService.getWallet.mockResolvedValue({ accountId: 'acc-123' });

      const result = await service.createStripeTopupIntent('user-1', 300, 'THB', 'Top up 300');

      expect(prisma.topupOrder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          amount: '300.0000',
          currency: 'THB',
          status: TopupOrderStatus.PENDING,
        }),
      });

      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 30000,
          currency: 'thb',
        }),
        expect.objectContaining({
          idempotencyKey: expect.stringMatching(/^topup_user-1_/),
        }),
      );

      expect(prisma.topupOrder.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          stripePaymentIntentId: 'pi_test_intent_id',
          clientSecretRef: 'secret_stripe_intent',
        },
      });

      expect(financeService.createPaymentIntent).toHaveBeenCalledWith(
        'acc-123',
        'pi_test_intent_id',
        '300.0000',
        'TOPUP',
      );

      expect(result.orderId).toBe('order-1');
      expect(result.clientSecret).toBe('secret_stripe_intent');
    });
  });

  describe('getTopupOrderStatus', () => {
    it('should query Stripe API if status is PENDING to actively check and reconcile', async () => {
      const mockOrder = {
        id: 'order-123',
        userId: 'user-1',
        status: TopupOrderStatus.PENDING,
        stripePaymentIntentId: 'pi_reconcile_1',
        amount: 500,
        currency: 'THB',
      };

      prisma.topupOrder.findUnique.mockResolvedValue(mockOrder);
      prisma.topupOrder.findFirst
        .mockResolvedValueOnce(mockOrder) // first load
        .mockResolvedValueOnce({ ...mockOrder, status: TopupOrderStatus.PAID, financeTransactionId: 'txn-f1' }); // refetch

      mockStripeInstance.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_reconcile_1',
        status: 'succeeded',
        metadata: {
          userId: 'user-1',
          orderId: 'order-123',
        },
      });

      const result = await service.getTopupOrderStatus('user-1', 'order-123');

      expect(mockStripeInstance.paymentIntents.retrieve).toHaveBeenCalledWith('pi_reconcile_1');
      // Verifies active polling webhook trigger triggered handlePaymentIntentSucceeded
      expect(prisma.topupOrder.update).toHaveBeenCalled();
      expect(financeService.processPaymentWebhook).toHaveBeenCalledWith('pi_reconcile_1', 'SUCCESS');

      expect(result.status).toBe(TopupOrderStatus.PAID);
    });
  });

  describe('previewP2PTransfer & transferP2P', () => {
    it('should throw error in preview if transfer amount below minP2pTransfer', async () => {
      financeService.getSystemSettings.mockResolvedValue({
        minP2pTransfer: 50,
      });

      await expect(
        service.previewP2PTransfer('user-1', { recipientPhone: '0812345678', amount: 20 }),
      ).rejects.toThrow(new HttpException({ message: 'Minimum transfer amount is ฿50.00' }, HttpStatus.BAD_REQUEST));
    });

    it('should successfully execute transferP2P, charging correct amounts', async () => {
      financeService.getSystemSettings.mockResolvedValue({
        minP2pTransfer: 10,
        perTransactionLimit: 50000,
      });
      financeService.getWallet.mockResolvedValue({ dailyLimit: 10000 });

      // recipient check
      prisma.user.findFirst.mockResolvedValue({ id: 'user-recipient' });
      financeService.transferByPhone.mockResolvedValue({ transactionId: 'txn-p2p-success' });

      const result = await service.transferP2P('user-1', {
        recipientPhone: '0812345678',
        amount: 200,
        note: 'lunch',
        idempotencyKey: 'p2p-idem-key',
      });

      expect(financeService.transferByPhone).toHaveBeenCalledWith('user-1', {
        recipientPhone: '0812345678',
        amount: '200.0000',
        note: 'lunch',
        idempotencyKey: 'p2p-idem-key',
        metadata: {
          recipientName: '0812345678',
          recipientPhone: '0812345678',
          senderName: 'User',
          senderPhone: undefined,
        },
      });

      expect(result.transactionId).toBe('txn-p2p-success');
    });
  });

  describe('FavoriteRecipients CRUD', () => {
    describe('getFavoriteRecipients', () => {
      it('should return all favorite recipients for a user', async () => {
        const mockFavorites = [
          { id: 'fav-1', userId: 'user-1', recipientPhone: '0812345678', recipientName: 'Somsri', nickname: 'Mom' },
        ];
        prisma.favoriteRecipient.findMany.mockResolvedValue(mockFavorites);

        const result = await service.getFavoriteRecipients('user-1');

        expect(prisma.favoriteRecipient.findMany).toHaveBeenCalledWith({
          where: { userId: 'user-1' },
          orderBy: { createdAt: 'desc' },
        });
        expect(result).toEqual(mockFavorites);
      });
    });

    describe('addFavoriteRecipient', () => {
      it('should throw HttpException if recipient phone is not registered', async () => {
        prisma.user.findFirst.mockResolvedValue(null);

        await expect(
          service.addFavoriteRecipient('user-1', { recipientPhone: '0812345678', nickname: 'Mom' }),
        ).rejects.toThrow(new HttpException('เบอร์โทรศัพท์ปลายทางไม่ได้ลงทะเบียนในระบบ P-Wallet', HttpStatus.NOT_FOUND));
      });

      it('should throw HttpException if trying to add oneself', async () => {
        prisma.user.findFirst.mockResolvedValue({ id: 'user-1', phoneNumber: '0812345678' });

        await expect(
          service.addFavoriteRecipient('user-1', { recipientPhone: '0812345678', nickname: 'Self' }),
        ).rejects.toThrow(new HttpException('ไม่สามารถเพิ่มเบอร์ของตนเองเป็นรายการโปรดได้', HttpStatus.BAD_REQUEST));
      });

      it('should successfully upsert favorite recipient with real name from KYC', async () => {
        prisma.user.findFirst.mockResolvedValue({ id: 'user-recipient', phoneNumber: '0812345678' });
        prisma.kYCData.findUnique.mockResolvedValue({ idCardName: 'Somsri Rakdee' });
        prisma.favoriteRecipient.upsert.mockResolvedValue({ id: 'fav-1' });

        const result = await service.addFavoriteRecipient('user-1', { recipientPhone: '0812345678', nickname: 'Mom' });

        expect(prisma.favoriteRecipient.upsert).toHaveBeenCalledWith({
          where: {
            userId_recipientPhone: {
              userId: 'user-1',
              recipientPhone: '0812345678',
            },
          },
          update: {
            recipientName: 'Somsri Rakdee',
            nickname: 'Mom',
          },
          create: {
            userId: 'user-1',
            recipientPhone: '0812345678',
            recipientName: 'Somsri Rakdee',
            nickname: 'Mom',
          },
        });
        expect(result).toBeDefined();
      });
    });

    describe('deleteFavoriteRecipient', () => {
      it('should throw HttpException if favorite recipient not found', async () => {
        prisma.favoriteRecipient.findFirst.mockResolvedValue(null);

        await expect(
          service.deleteFavoriteRecipient('user-1', 'invalid-fav-id'),
        ).rejects.toThrow(new HttpException('ไม่พบรายการผู้รับที่ชื่นชอบ', HttpStatus.NOT_FOUND));
      });

      it('should successfully delete favorite recipient', async () => {
        prisma.favoriteRecipient.findFirst.mockResolvedValue({ id: 'fav-1', userId: 'user-1' });
        prisma.favoriteRecipient.delete.mockResolvedValue({});

        const result = await service.deleteFavoriteRecipient('user-1', 'fav-1');

        expect(prisma.favoriteRecipient.delete).toHaveBeenCalledWith({
          where: { id: 'fav-1' },
        });
        expect(result.success).toBe(true);
      });
    });

    describe('requestStatementExport', () => {
      it('should throw HttpException if email is not verified', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
        prisma.userSetting.findUnique.mockResolvedValue(null); // not verified

        await expect(
          service.requestStatementExport('user-1', { year: 2026, month: 5 }),
        ).rejects.toThrow(HttpException);
      });

      it('should successfully store approval request on verified email', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
        prisma.userSetting.findUnique.mockResolvedValue({ key: 'email_verified', value: 'true' });
        redis.set.mockResolvedValue('OK');

        const result = await service.requestStatementExport('user-1', { year: 2026, month: 5 });

        expect(redis.set).toHaveBeenCalledWith(
          expect.stringMatching(/^admin:approvals:item:APR-/),
          expect.stringContaining('"category":"SECURITY"'),
        );
        expect(result.success).toBe(true);
      });
    });

    describe('forwardToGateway helpers', () => {
      it('getAccountByUserId should call forwardToGateway with correct URL', async () => {
        const mockAccount = [{ id: 'acc-123', balance: 500 }];
        jest.spyOn(historyService, 'forwardToGateway').mockResolvedValue(mockAccount);

        const result = await service.getAccountByUserId('user-123');

        expect(historyService.forwardToGateway).toHaveBeenCalledWith('get', '/api/v1/accounts/user/user-123');
        expect(result).toEqual({ data: mockAccount[0] });
      });

      it('get should call forwardToGateway with provided path', async () => {
        jest.spyOn(historyService, 'forwardToGateway').mockResolvedValue({ status: 'OK' });

        const result = await service.get('/some/custom/path');

        expect(historyService.forwardToGateway).toHaveBeenCalledWith('get', '/some/custom/path');
        expect(result).toEqual({ data: { status: 'OK' } });
      });
    });

    describe('Dashboard BFF and Bank Operations', () => {
      it('getDashboardData should return aggregated data for user', async () => {
        prisma.kYCData.findUnique.mockResolvedValue({ idCardName: 'Test User', verificationStatus: 'APPROVED' });
        prisma.user.findUnique.mockResolvedValue({ id: 'user-123', phoneNumber: '0812345678' });
        financeService.getWallet.mockResolvedValue({ id: 1, walletId: 'W1', balance: 1000, currency: 'THB', status: 'ACTIVE' });
        financeService.getTransactions.mockResolvedValue([]);
        loyaltyService.getUserBalance.mockResolvedValue({ balance: 150 });
        bannerService.getActiveBanners.mockResolvedValue([{ id: 'banner-1' }]);

        const result = await service.getDashboardData('user-123');

        expect(prisma.kYCData.findUnique).toHaveBeenCalledWith({ where: { userId: 'user-123' } });
        expect(financeService.getWallet).toHaveBeenCalledWith('user-123');
        expect(result.user.name).toBe('Test User');
        expect(result.wallet.balance).toBe(1000);
        expect(result.banners).toHaveLength(1);
        expect(result.recentTransactions).toHaveLength(0);
      });

      it('getLinkedBankAccounts should map and return accounts', async () => {
        financeService.getLinkedBankAccounts.mockResolvedValue([
          { id: 1, bankCode: 'SCB', bankName: 'Siam Commercial Bank', accountNumber: '123-xxx-x89', isDefault: true }
        ]);

        const result = await service.getLinkedBankAccounts('user-123');

        expect(financeService.getLinkedBankAccounts).toHaveBeenCalledWith('user-123');
        expect(result[0].bankCode).toBe('SCB');
        expect(result[0].accountNumberMasked).toBe('123-xxx-x89');
      });

      it('topUp should perform top-up via finance-service', async () => {
        financeService.topUp.mockResolvedValue({ transactionId: 'tx-topup-1', amount: 500, status: 'COMPLETED', createdAt: '2026-01-01' });
        financeService.getLinkedBankAccounts.mockResolvedValue([
          { id: 45, bankName: 'Kasikorn' }
        ]);

        const result = await service.topUp('user-123', 500, 45);

        expect(financeService.topUp).toHaveBeenCalledWith('user-123', 500, 45);
        expect(result.transactionId).toBe('tx-topup-1');
        expect(result.bankName).toBe('Kasikorn');
      });

      it('topUp should throw error on invalid amount', async () => {
        await expect(service.topUp('user-123', 0, 45)).rejects.toThrow(HttpException);
      });
    });

    describe('Stripe Webhook processing', () => {
      it('processStripeWebhook should throw error if signature is missing', async () => {
        await expect(service.processStripeWebhook(undefined, Buffer.from(''))).rejects.toThrow('Missing stripe signature');
      });

      it('processStripeWebhook payout.paid event should call confirm payout API', async () => {
        const mockEvent = {
          id: 'evt_1',
          type: 'payout.paid',
          data: {
            object: {
              id: 'po_123',
              amount: 150000,
              arrival_date: 1774890000,
            }
          }
        };
        mockStripeInstance.webhooks = mockStripeInstance.webhooks || {};
        mockStripeInstance.webhooks.constructEvent = jest.fn().mockReturnValue(mockEvent);
        jest.spyOn(stripeService, 'forwardToGateway').mockResolvedValue({ success: true });

        const result = await service.processStripeWebhook('sig_123', Buffer.from('raw_body'));

        expect(mockStripeInstance.webhooks.constructEvent).toHaveBeenCalled();
        expect(stripeService.forwardToGateway).toHaveBeenCalledWith(
          'post',
          '/api/admin/treasury/internal/payouts/stripe-confirmed',
          expect.objectContaining({
            stripePayoutId: 'po_123',
            amount: '1500.0000',
            arrivalDate: '2026-03-30T17:00:00.000Z',
          })
        );
        expect(result).toEqual({ received: true });
      });

      it('processStripeWebhook payment_intent.payment_failed should update order to FAILED', async () => {
        const mockEvent = {
          id: 'evt_2',
          type: 'payment_intent.payment_failed',
          data: {
            object: {
              id: 'pi_fail_123',
            }
          }
        };
        mockStripeInstance.webhooks.constructEvent = jest.fn().mockReturnValue(mockEvent);
        prisma.topupOrder.findUnique.mockResolvedValue({ id: 'order-fail', status: 'PENDING' });

        await service.processStripeWebhook('sig_123', Buffer.from('raw_body'));

        expect(financeService.processPaymentWebhook).toHaveBeenCalledWith('pi_fail_123', 'FAILED');
        expect(prisma.topupOrder.update).toHaveBeenCalledWith({
          where: { id: 'order-fail' },
          data: { status: TopupOrderStatus.FAILED, processedEventId: 'evt_2' }
        });
      });
    });

    describe('Bank & Webhook CRUD Mock placeholders', () => {
      it('should return empty arrays and mock success values for CRUD placeholders', async () => {
        expect(await service.getBankIntegrations()).toEqual([]);
        expect(await service.createBankIntegration({})).toEqual({ success: true });
        expect(await service.updateBankIntegration('1', {})).toEqual({ success: true });
        expect(await service.deleteBankIntegration('1')).toEqual({ success: true });

        expect(await service.getWebhooks()).toEqual([]);
        expect(await service.createWebhook({})).toEqual({ success: true });
        expect(await service.deleteWebhook('1')).toEqual({ success: true });
      });
    });
  });
});

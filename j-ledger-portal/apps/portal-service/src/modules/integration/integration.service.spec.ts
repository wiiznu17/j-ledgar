import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationService } from './integration.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { FinanceService } from './finance.service';
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

const mockStripeInstance = {
  balance: {
    retrieve: jest.fn(),
  },
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripeInstance);
});

describe('IntegrationService', () => {
  let service: IntegrationService;
  let prisma: any;
  let financeService: any;
  let billingService: any;
  let loyaltyService: any;
  let bannerService: any;
  let httpService: any;
  let configService: any;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationService,
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
      ],
    }).compile();

    service = module.get<IntegrationService>(IntegrationService);
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
});

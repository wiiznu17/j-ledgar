import { Test, TestingModule } from '@nestjs/testing';
import { MerchantService } from './merchant.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { IntegrationService } from '../integration/integration.service';
import { FinanceService } from '../integration/finance.service';
import { AuditService } from '../audit/audit.service';
import { TerminalIdempotencyService } from './security/terminal-idempotency.service';
import { StorageService } from '../../core/storage/storage.service';
import { REDIS_CLIENT } from '../../core/common/constants';
import {
  createMockPrismaService,
  createMockFinanceService,
  createMockAuditService,
  createMockStorageService,
  createMockRedisClient,
} from '../../__tests__/test-utils';
import { HttpException, HttpStatus } from '@nestjs/common';
import { createHmac } from 'crypto';

describe('MerchantService', () => {
  let service: MerchantService;
  let prisma: any;
  let financeService: any;
  let idempotencyService: any;
  let redis: any;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    financeService = createMockFinanceService();
    idempotencyService = {
      handleIdempotency: jest.fn((termId, op, key, payload, processFn) => processFn()),
    };
    redis = createMockRedisClient();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: IntegrationService,
          useValue: {},
        },
        {
          provide: FinanceService,
          useValue: financeService,
        },
        {
          provide: AuditService,
          useValue: createMockAuditService(),
        },
        {
          provide: TerminalIdempotencyService,
          useValue: idempotencyService,
        },
        {
          provide: StorageService,
          useValue: createMockStorageService(),
        },
        {
          provide: REDIS_CLIENT,
          useValue: redis,
        },
      ],
    }).compile();

    service = module.get<MerchantService>(MerchantService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateTerminalSignature', () => {
    const mockTerminal = {
      id: 'term-1',
      secretKey: 'my-super-secret-key',
      status: 'ACTIVE',
    };

    it('should compute HMAC-SHA256 and return true for valid signature', async () => {
      prisma.terminal.findUnique.mockResolvedValue(mockTerminal);

      const timestamp = String(Date.now());
      const nonce = 'random-nonce';
      const method = 'POST';
      const path = '/api/v1/terminal/payment';

      const message = `${method}:${path}:${timestamp}:${nonce}`;
      const signature = createHmac('sha256', mockTerminal.secretKey)
        .update(message)
        .digest('hex');

      const result = await service.validateTerminalSignature(
        'term-1',
        signature,
        timestamp,
        nonce,
        method,
        path,
      );

      expect(result).toBe(true);
    });

    it('should return false for inactive or non-existent terminal', async () => {
      prisma.terminal.findUnique.mockResolvedValue({
        ...mockTerminal,
        status: 'REVOKED',
      });

      const result = await service.validateTerminalSignature(
        'term-1',
        'sig',
        'time',
        'nonce',
        'POST',
        'path',
      );

      expect(result).toBe(false);
    });

    it('should return false when signature length mismatch', async () => {
      prisma.terminal.findUnique.mockResolvedValue(mockTerminal);

      const result = await service.validateTerminalSignature(
        'term-1',
        'short-sig',
        'time',
        'nonce',
        'POST',
        'path',
      );

      expect(result).toBe(false);
    });
  });

  describe('findAllPartners', () => {
    it('should return paginated partners matching search and status filter', async () => {
      prisma.partner.findMany.mockResolvedValue([
        { id: 'p-1', name: 'Partner One', status: 'ACTIVE' },
      ]);
      prisma.partner.count.mockResolvedValue(1);

      const result = await service.findAllPartners({
        page: 1,
        limit: 5,
        search: 'Partner',
        status: 'ACTIVE',
      });

      expect(prisma.partner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            OR: [
              { name: { contains: 'Partner', mode: 'insensitive' } },
              { taxId: { contains: 'Partner', mode: 'insensitive' } },
            ],
          }),
          skip: 0,
          take: 5,
        }),
      );

      expect(result).toEqual({
        data: [{ id: 'p-1', name: 'Partner One', status: 'ACTIVE' }],
        pagination: {
          total: 1,
          page: 1,
          limit: 5,
          totalPages: 1,
        },
      });
    });
  });

  describe('processTerminalPayment', () => {
    it('should throw error when payment token is invalid or expired', async () => {
      redis.get.mockResolvedValue(null); // token expired or invalid

      await expect(
        service.processTerminalPayment('term-1', {
          amount: 500,
          idempotencyKey: 'idem-1',
          customerToken: 'PAY-TOKEN123',
        }),
      ).rejects.toThrow(new HttpException('Invalid or expired payment token', HttpStatus.BAD_REQUEST));
    });

    it('should retrieve resolved customer UUID, validate limits, and execute multi-leg split payment', async () => {
      redis.get.mockResolvedValue('customer-uuid-123');
      redis.del.mockResolvedValue(1);

      const mockTerminalAndMerchant = {
        id: 'term-1',
        name: 'POS Terminal 1',
        secretKey: 'secret',
        status: 'ACTIVE',
        merchant: {
          name: 'Burger Joint',
          partnerId: 'partner-uuid-999',
        },
      };

      prisma.terminal.findUnique.mockResolvedValue(mockTerminalAndMerchant);
      prisma.partner.findUnique.mockResolvedValue({
        id: 'partner-uuid-999',
        isPaymentEnabled: true,
        dailyReceiveLimit: 100000,
        feeRate: 0.03, // 3% fee
        financeAccounts: {
          pending: 'merchant-pending-acc',
        },
      });

      // System settings
      financeService.getSystemSettings.mockResolvedValue({
        minMerchantPayment: 10,
        perTransactionLimit: 50000,
        vatRate: 0.07,
      });

      // Customer wallet details
      financeService.getWallet.mockResolvedValue({
        id: '123',
        walletId: 'customer-wallet-acc',
        dailyLimit: 30000,
      });

      // Mock system partner
      prisma.partner.findFirst.mockResolvedValue({
        id: 'system-partner-id',
        financeAccounts: {
          revenue: 'system-revenue-acc',
          vat_payable: 'system-vat-payable-acc',
        },
      });

      // Mock successful transaction logic inside processTerminalPayment
      prisma.merchantPayment.create = jest.fn().mockResolvedValue({ id: 'pmt-1' });
      financeService.performMerchantMultiPay.mockResolvedValue({
        transactionId: 'txn-uuid-123',
      });

      // Trigger the process
      await service.processTerminalPayment('term-1', {
        amount: 214, // 214 THB
        idempotencyKey: 'idem-1',
        customerToken: 'PAY-TOKEN123',
      });

      // Verify token deleted immediately
      expect(redis.del).toHaveBeenCalledWith('pay_token:PAY-TOKEN123');

      // Verify transactional updates
      expect(prisma.partner.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'partner-uuid-999' },
        }),
      );

      // Verify FinanceService integrations for payments/transfers
      expect(financeService.getWallet).toHaveBeenCalledWith('customer-uuid-123');
    });
  });
});

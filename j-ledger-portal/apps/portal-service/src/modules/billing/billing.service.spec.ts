import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { FinanceService } from '../../core/finance/finance.service';
import { ConfigService } from '@nestjs/config';
import { createMockPrismaService, createMockFinanceService, createMockConfigService } from '../../__tests__/test-utils';
import { InvoiceStatus } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BillingService', () => {
  let service: BillingService;
  let prisma: any;
  let financeService: any;
  let configService: any;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    financeService = createMockFinanceService();
    configService = createMockConfigService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: FinanceService,
          useValue: financeService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvoice', () => {
    const mockItems = [
      { name: 'Item A', quantity: 2, unitPrice: 100 },
      { name: 'Item B', quantity: 1, unitPrice: 300 },
    ];

    it('should calculate subtotal, VAT (7%), platform fees and create invoice for partner', async () => {
      financeService.getSystemSettings.mockResolvedValue({
        vatRate: '0.07',
        minMerchantPayment: '100',
      });

      prisma.partner.findUnique.mockResolvedValue({
        id: 'partner-1',
        feeRate: 0.03,
      });

      prisma.invoice.count.mockResolvedValue(5);
      prisma.invoice.create.mockImplementation(({ data }) => Promise.resolve({ id: 'inv-1', ...data }));

      const result = await service.createInvoice({
        userId: 'user-1',
        partnerId: 'partner-1',
        senderName: 'Sender',
        senderDetail: 'Detail',
        items: mockItems,
      });

      // Subtotal = (2*100) + (1*300) = 500
      // Tax = 500 * 0.07 = 35
      // Total = 535
      // Fee (Gross) = 535 * 0.03 = 16.05
      // FeeTax = 16.05 * 0.07 = 1.12
      expect(result.amount).toBe(500);
      expect(result.tax).toBe(35);
      expect(result.total).toBe(535);
      expect(result.feeRate).toBe(0.03);
      expect(result.feeAmount).toBe(16.05);
      expect(result.feeTax).toBe(1.12);
      expect(result.invoiceNumber).toMatch(/^INV-\d{8}-0006-[A-Z0-9]{4}$/);
      expect(result.status).toBe(InvoiceStatus.PENDING);
    });

    it('should throw BadRequestException if partner total is below minMerchantPayment', async () => {
      financeService.getSystemSettings.mockResolvedValue({
        vatRate: '0.07',
        minMerchantPayment: '1000', // high min amount
      });

      await expect(
        service.createInvoice({
          userId: 'user-1',
          partnerId: 'partner-1',
          senderName: 'Sender',
          senderDetail: 'Detail',
          items: mockItems, // Total 535 is below 1000
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create invoice without tax and fees if partnerId is not provided', async () => {
      financeService.getSystemSettings.mockResolvedValue({
        vatRate: '0.07',
        minMerchantPayment: '100',
      });

      prisma.invoice.count.mockResolvedValue(0);
      prisma.invoice.create.mockImplementation(({ data }) => Promise.resolve({ id: 'inv-2', ...data }));

      const result = await service.createInvoice({
        userId: 'user-2',
        senderName: 'User Invoice',
        senderDetail: 'Detail',
        items: mockItems,
      });

      expect(result.amount).toBe(500);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(500);
      expect(result.feeRate).toBeNull();
      expect(result.feeAmount).toBeNull();
      expect(result.feeTax).toBeNull();
    });
  });

  describe('getInvoiceById', () => {
    it('should return invoice from Invoice table if found', async () => {
      const mockInvoice = { id: 'inv-123', userId: 'user-1', total: 500, items: [] };
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);

      const result = await service.getInvoiceById('inv-123', 'user-1');

      expect(result).toEqual(mockInvoice);
    });

    it('should return synthesized invoice from TopupOrder if invoice not found', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);
      prisma.topupOrder.findFirst.mockResolvedValue({
        id: 'topup-1',
        userId: 'user-1',
        amount: 1000,
        currency: 'THB',
        status: 'PAID',
        financeTransactionId: 'txn-stripe',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.getInvoiceById('topup-1', 'user-1');

      expect(result.id).toBe('topup-1');
      expect(result.invoiceNumber).toBe('INV-TOPUP-TOPUP-1');
      expect(result.total).toBe(1000);
      expect(result.status).toBe('PAID');
    });

    it('should return synthesized invoice from MerchantPayment if invoice/topup not found and ownership matches', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);
      prisma.topupOrder.findFirst.mockResolvedValue(null);
      prisma.merchantPayment.findFirst.mockResolvedValue({
        id: 'payment-1',
        amount: 214,
        currency: 'THB',
        status: 'COMPLETED',
        referenceId: 'TXN123',
        createdAt: new Date(),
        updatedAt: new Date(),
        merchant: {
          name: 'Burger Shop',
          category: 'Food',
          partnerId: 'partner-1',
        },
      });

      financeService.getWallet.mockResolvedValue({ id: '123', walletId: 'W1' });
      financeService.getTransactionByUuid.mockResolvedValue({ fromWalletId: '123', referenceId: 'payment-1' });

      const result = await service.getInvoiceById('payment-1', 'user-1');

      expect(result.id).toBe('payment-1');
      expect(result.senderName).toBe('Burger Shop');
      expect(result.total).toBe(214);
      expect(result.tax).toBe(14); // 214 * (0.07/1.07) = 14
      expect(result.status).toBe('PAID');
    });

    it('should throw NotFoundException if all searches return null', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);
      prisma.topupOrder.findFirst.mockResolvedValue(null);
      prisma.merchantPayment.findFirst.mockResolvedValue(null);

      await expect(service.getInvoiceById('unknown', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('payInvoice', () => {
    it('should throw BadRequestException if invoice is already paid', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-1',
        status: InvoiceStatus.PAID,
      });

      await expect(service.payInvoice('inv-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should process 4-way split payment using FinanceService and update invoice status', async () => {
      const mockInvoice = {
        id: 'inv-1',
        invoiceNumber: 'INV-001',
        total: 535.0,
        tax: 35.0,
        feeAmount: 15.0,
        feeTax: 1.05,
        partnerId: 'partner-1',
        status: InvoiceStatus.PENDING,
      };

      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);
      financeService.getWallet.mockResolvedValue({ walletId: 'customer-wallet-id' });
      
      // System partner (taxId = '0000000000000')
      prisma.partner.findFirst.mockResolvedValue({
        id: 'system-partner-id',
        financeAccounts: {
          revenue: 'system-revenue-acc',
          vat_payable: 'system-vat-payable-acc',
        },
      });

      // Merchant partner
      prisma.partner.findUnique.mockResolvedValue({
        id: 'partner-1',
        financeAccounts: {
          pending: 'merchant-pending-acc',
          vat: 'merchant-vat-acc',
        },
      });

      prisma.invoice.update.mockImplementation(({ data }) => Promise.resolve({ ...mockInvoice, ...data }));

      const result = await service.payInvoice('inv-1', 'user-1');

      // Net = 535 - 35 - 15 - 1.05 = 483.95
      expect(financeService.performTransfer).toHaveBeenNthCalledWith(1, expect.objectContaining({
        fromAccountId: 'customer-wallet-id',
        toAccountId: 'merchant-pending-acc',
        amount: '483.95',
      }));

      expect(financeService.performTransfer).toHaveBeenNthCalledWith(2, expect.objectContaining({
        fromAccountId: 'customer-wallet-id',
        toAccountId: 'merchant-vat-acc',
        amount: '35.00',
      }));

      expect(financeService.performTransfer).toHaveBeenNthCalledWith(3, expect.objectContaining({
        fromAccountId: 'customer-wallet-id',
        toAccountId: 'system-revenue-acc',
        amount: '15.00',
      }));

      expect(financeService.performTransfer).toHaveBeenNthCalledWith(4, expect.objectContaining({
        fromAccountId: 'customer-wallet-id',
        toAccountId: 'system-vat-payable-acc',
        amount: '1.05',
      }));

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: expect.objectContaining({
          status: InvoiceStatus.PAID,
          referenceId: 'SPLIT_PAY_inv-1',
        }),
        include: { items: true },
      });

      expect(result.status).toBe(InvoiceStatus.PAID);
    });
  });
});

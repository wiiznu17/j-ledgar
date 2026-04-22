import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TransferService } from './transfer.service';
import { PinService } from './pin.service';
import { PrismaService } from '@/prisma/prisma.service';
import { LedgerClient } from '../clients/ledger.client';

describe('TransferService', () => {
  let service: TransferService;
  let ledgerClient: LedgerClient;

  const mockPrismaService = {
    kycData: {
      findUnique: jest.fn(),
    },
    transfer: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    approval: {
      create: jest.fn(),
    },
  };

  const mockPinService = {
    validatePin: jest.fn(),
  };

  const mockLedgerClient = {
    executeP2pTransfer: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PinService, useValue: mockPinService },
        { provide: LedgerClient, useValue: mockLedgerClient },
      ],
    }).compile();

    service = module.get<TransferService>(TransferService);
    ledgerClient = module.get<LedgerClient>(LedgerClient);
    jest.clearAllMocks();
  });

  describe('createP2pTransfer', () => {
    const userId = 'user-1';
    const dto = {
      recipientPhone: '+66812345678',
      amount: 1000,
      pin: '123456',
      idempotencyKey: 'idemp-1',
    };

    it('should create transfer successfully when everything is valid', async () => {
      // Mock PIN validation
      mockPinService.validatePin.mockResolvedValue(undefined);

      // Mock KYC APPROVED
      mockPrismaService.kycData.findUnique.mockResolvedValue({ verificationStatus: 'APPROVED' });

      // Mock No existing transfer (idempotency)
      mockPrismaService.transfer.findUnique.mockResolvedValue(null);

      // Mock Recipient lookup
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-2' });

      // Mock Transfer record creation
      mockPrismaService.transfer.create.mockResolvedValue({ id: 'transfer-1', createdAt: new Date() });

      // Mock Ledger execution
      mockLedgerClient.executeP2pTransfer.mockResolvedValue({ id: 'ledger-txn-1' });

      // Mock Final transfer update
      const completedTransfer = { id: 'transfer-1', status: 'COMPLETED', ledgerTxnId: 'ledger-txn-1' };
      mockPrismaService.transfer.update.mockResolvedValue(completedTransfer);

      const result = await service.createP2pTransfer(userId, dto);

      expect(result).toBeDefined();
      expect(mockLedgerClient.executeP2pTransfer).toHaveBeenCalled();
      expect(mockPrismaService.transfer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'transfer-1' },
          data: expect.objectContaining({ status: 'COMPLETED' }),
        }),
      );
    });

    it('should throw ForbiddenException if KYC is not approved', async () => {
      mockPinService.validatePin.mockResolvedValue(undefined);
      mockPrismaService.kycData.findUnique.mockResolvedValue({ verificationStatus: 'PENDING' });

      await expect(service.createP2pTransfer(userId, dto)).rejects.toThrow(ForbiddenException);
    });

    it('should trigger Maker-Checker approval for high-value transfers', async () => {
      const highValueDto = { ...dto, amount: 20000000 }; // 200,000 THB

      mockPinService.validatePin.mockResolvedValue(undefined);
      mockPrismaService.kycData.findUnique.mockResolvedValue({ verificationStatus: 'APPROVED' });
      mockPrismaService.transfer.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-2' });
      mockPrismaService.transfer.create.mockResolvedValue({ id: 'transfer-high', createdAt: new Date() });
      mockPrismaService.approval.create.mockResolvedValue({ id: 'approval-1' });

      const result = await service.createP2pTransfer(userId, highValueDto) as any;

      expect(result.status).toBe('PENDING_APPROVAL');
      expect(mockPrismaService.approval.create).toHaveBeenCalled();
      expect(mockLedgerClient.executeP2pTransfer).not.toHaveBeenCalled();
    });

    it('should handle idempotency and return existing transfer', async () => {
      const existingTransfer = { id: 'transfer-1', status: 'COMPLETED' };
      mockPinService.validatePin.mockResolvedValue(undefined);
      mockPrismaService.kycData.findUnique.mockResolvedValue({ verificationStatus: 'APPROVED' });
      mockPrismaService.transfer.findUnique.mockResolvedValue(existingTransfer);

      const result = await service.createP2pTransfer(userId, dto);

      expect(result.id).toBe(existingTransfer.id);
      expect(mockPrismaService.transfer.create).not.toHaveBeenCalled();
    });
  });
});

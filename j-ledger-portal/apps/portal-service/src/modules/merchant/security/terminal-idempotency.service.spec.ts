import { Test, TestingModule } from '@nestjs/testing';
import { TerminalIdempotencyService } from './terminal-idempotency.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { createMockPrismaService } from '../../../__tests__/test-utils';
import { Prisma } from '@prisma/client';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('TerminalIdempotencyService', () => {
  let service: TerminalIdempotencyService;
  let prisma: any;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TerminalIdempotencyService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<TerminalIdempotencyService>(TerminalIdempotencyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateHash', () => {
    it('should generate deterministic sha256 hex string', () => {
      const payload = { amount: 100, reference: 'REF' };
      const hash1 = service.generateHash(payload);
      const hash2 = service.generateHash(payload);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('handleIdempotency', () => {
    const payload = { orderId: 'ord-123' };
    const terminalId = 'term-1';
    const operation = 'PAYMENT';
    const idempotencyKey = 'idem-key-abc';

    it('should reserve key, run processFn, update record, and return non-cached result on first call', async () => {
      const processFn = jest.fn().mockResolvedValue({ status: 200, data: { success: true } });

      prisma.terminalIdempotencyRecord.create.mockResolvedValue({});
      prisma.terminalIdempotencyRecord.update.mockResolvedValue({});

      const result = await service.handleIdempotency(
        terminalId,
        operation,
        idempotencyKey,
        payload,
        processFn,
      );

      expect(prisma.terminalIdempotencyRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          terminalId,
          operation,
          idempotencyKey,
          status: 102, // PROCESSING
        }),
      });

      expect(processFn).toHaveBeenCalled();

      expect(prisma.terminalIdempotencyRecord.update).toHaveBeenCalledWith({
        where: {
          terminalId_operation_idempotencyKey: {
            terminalId,
            operation,
            idempotencyKey,
          },
        },
        data: {
          status: 200,
          responsePayload: { success: true },
        },
      });

      expect(result).toEqual({ status: 200, data: { success: true }, fromCache: false });
    });

    it('should return cached response on duplicate key with same payload', async () => {
      const processFn = jest.fn();

      // Throw P2002 collision error on reservation
      const error = new Error('Unique constraint failed') as any;
      error.code = 'P2002';
      Object.setPrototypeOf(error, Prisma.PrismaClientKnownRequestError.prototype);
      prisma.terminalIdempotencyRecord.create.mockRejectedValue(error);

      // Return completed record on lookup
      prisma.terminalIdempotencyRecord.findUnique.mockResolvedValue({
        terminalId,
        operation,
        idempotencyKey,
        requestHash: service.generateHash(payload),
        responsePayload: { success: true },
        status: 200,
      });

      const result = await service.handleIdempotency(
        terminalId,
        operation,
        idempotencyKey,
        payload,
        processFn,
      );

      expect(processFn).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 200, data: { success: true }, fromCache: true });
    });

    it('should throw CONFLICT (409) when same key used with different payload', async () => {
      const processFn = jest.fn();

      const error = new Error('Unique constraint failed') as any;
      error.code = 'P2002';
      Object.setPrototypeOf(error, Prisma.PrismaClientKnownRequestError.prototype);
      prisma.terminalIdempotencyRecord.create.mockRejectedValue(error);

      // Return record with different hash on lookup
      prisma.terminalIdempotencyRecord.findUnique.mockResolvedValue({
        terminalId,
        operation,
        idempotencyKey,
        requestHash: 'different-hash-value',
        responsePayload: { success: true },
        status: 200,
      });

      await expect(
        service.handleIdempotency(terminalId, operation, idempotencyKey, payload, processFn),
      ).rejects.toThrow(
        new HttpException(
          'Idempotency key conflict: same key used with different payload',
          HttpStatus.CONFLICT,
        ),
      );
    });

    it('should throw CONFLICT (409) when request is still processing (status 102)', async () => {
      const processFn = jest.fn();

      const error = new Error('Unique constraint failed') as any;
      error.code = 'P2002';
      Object.setPrototypeOf(error, Prisma.PrismaClientKnownRequestError.prototype);
      prisma.terminalIdempotencyRecord.create.mockRejectedValue(error);

      // Return record with status 102 (PROCESSING)
      prisma.terminalIdempotencyRecord.findUnique.mockResolvedValue({
        terminalId,
        operation,
        idempotencyKey,
        requestHash: service.generateHash(payload),
        responsePayload: { status: 'PROCESSING' },
        status: 102,
      });

      await expect(
        service.handleIdempotency(terminalId, operation, idempotencyKey, payload, processFn),
      ).rejects.toThrow(
        new HttpException(
          'Request with this idempotency key is in progress, retry shortly',
          HttpStatus.CONFLICT,
        ),
      );
    });

    it('should delete reservation record and rethrow error when processFn throws', async () => {
      const processFn = jest.fn().mockRejectedValue(new Error('Process error'));

      prisma.terminalIdempotencyRecord.create.mockResolvedValue({});
      prisma.terminalIdempotencyRecord.deleteMany.mockResolvedValue({ count: 1 });

      await expect(
        service.handleIdempotency(terminalId, operation, idempotencyKey, payload, processFn),
      ).rejects.toThrow('Process error');

      expect(prisma.terminalIdempotencyRecord.deleteMany).toHaveBeenCalledWith({
        where: { terminalId, operation, idempotencyKey },
      });
    });
  });
});

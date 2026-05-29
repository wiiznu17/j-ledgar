import { Test, TestingModule } from '@nestjs/testing';
import { LoyaltyService } from './loyalty.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { KafkaProducerService } from '../notification/kafka-producer.service';
import { PointTransactionType } from '@prisma/client';
import { createMockPrismaService, createMockKafkaProducer } from '../../__tests__/test-utils';
import { KafkaTopic, NotificationEventType } from '@repo/dto';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let prisma: any;
  let kafkaProducer: any;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    kafkaProducer = createMockKafkaProducer();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: KafkaProducerService,
          useValue: kafkaProducer,
        },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserBalance', () => {
    it('should return user balance when UserPoint record exists', async () => {
      prisma.userPoint.findUnique.mockResolvedValue({
        userId: 'user-1',
        balance: 150,
        lifetimePoints: 500,
      });

      const result = await service.getUserBalance('user-1');

      expect(prisma.userPoint.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toEqual({
        userId: 'user-1',
        balance: 150,
        lifetimePoints: 500,
      });
    });

    it('should return default balance when UserPoint record does not exist', async () => {
      prisma.userPoint.findUnique.mockResolvedValue(null);

      const result = await service.getUserBalance('user-1');

      expect(result).toEqual({ balance: 0, lifetimePoints: 0 });
    });
  });

  describe('earnPoints', () => {
    const mockRule = {
      eventType: 'TRANSACTION',
      pointsPerThb: 0.1,
      minAmount: 100,
      maxPoints: 50,
      isActive: true,
      isLocked: false,
    };

    it('should return null when no rule or inactive rule found', async () => {
      prisma.loyaltyRule.findUnique.mockResolvedValue(null);

      const result = await service.earnPoints('user-1', 200, 'TRANSACTION', 'desc');

      expect(result).toBeNull();
    });

    it('should return null when amount is below minAmount', async () => {
      prisma.loyaltyRule.findUnique.mockResolvedValue(mockRule);

      const result = await service.earnPoints('user-1', 50, 'TRANSACTION', 'desc');

      expect(result).toBeNull();
    });

    it('should calculate points, upsert balance, and emit event', async () => {
      prisma.loyaltyRule.findUnique.mockResolvedValue(mockRule);
      prisma.userPoint.upsert.mockResolvedValue({
        userId: 'user-1',
        balance: 120,
        lifetimePoints: 120,
      });
      prisma.pointHistory.create.mockResolvedValue({
        id: 'hist-1',
      });

      const result = await service.earnPoints('user-1', 200, 'TRANSACTION', 'desc', 'ref-1');

      expect(prisma.userPoint.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        update: {
          balance: { increment: 20 },
          lifetimePoints: { increment: 20 },
        },
        create: {
          userId: 'user-1',
          balance: 20,
          lifetimePoints: 20,
        },
      });

      expect(prisma.pointHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          amount: 20,
          type: PointTransactionType.EARN,
          description: 'desc',
          referenceId: 'ref-1',
        }),
      });

      expect(kafkaProducer.emit).toHaveBeenCalledWith(
        KafkaTopic.LOYALTY_EVENTS,
        expect.objectContaining({
          userId: 'user-1',
          eventType: NotificationEventType.LOYALTY_EARN,
          referenceId: 'ref-1',
          metadata: expect.objectContaining({
            points: 20,
            totalBalance: 120,
            source: 'TRANSACTION',
          }),
        }),
      );

      expect(result).toBeDefined();
    });

    it('should cap points at maxPoints if defined', async () => {
      prisma.loyaltyRule.findUnique.mockResolvedValue(mockRule);
      prisma.userPoint.upsert.mockResolvedValue({
        userId: 'user-1',
        balance: 150,
      });

      await service.earnPoints('user-1', 1000, 'TRANSACTION', 'desc');

      // 1000 THB * 0.1 = 100 points, capped at 50 maxPoints
      expect(prisma.userPoint.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {
            balance: { increment: 50 },
            lifetimePoints: { increment: 50 },
          },
        }),
      );
    });
  });

  describe('redeemPoints', () => {
    it('should throw error when user has insufficient balance', async () => {
      prisma.userPoint.findUnique.mockResolvedValue({
        userId: 'user-1',
        balance: 30,
      });

      await expect(
        service.redeemPoints('user-1', 50, 'redeem deal'),
      ).rejects.toThrow('Insufficient points balance');
    });

    it('should deduct points and record history when balance is sufficient', async () => {
      prisma.userPoint.findUnique.mockResolvedValue({
        userId: 'user-1',
        balance: 100,
      });
      prisma.userPoint.update.mockResolvedValue({
        userId: 'user-1',
        balance: 50,
      });

      const result = await service.redeemPoints('user-1', 50, 'redeem deal', 'ref-2');

      expect(prisma.userPoint.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { balance: { decrement: 50 } },
      });
      expect(prisma.pointHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          amount: -50,
          type: PointTransactionType.REDEEM,
          description: 'redeem deal',
          referenceId: 'ref-2',
        },
      });
      expect(result.balance).toBe(50);
    });
  });

  describe('updateRule', () => {
    it('should throw if rule is locked and not being unlocked', async () => {
      prisma.loyaltyRule.findUnique.mockResolvedValue({
        eventType: 'SIGNUP',
        isLocked: true,
      });

      await expect(
        service.updateRule('SIGNUP', { pointsPerThb: 0.5 }, 'admin'),
      ).rejects.toThrow('Rule is locked');
    });

    it('should update rule if rule is unlocked', async () => {
      prisma.loyaltyRule.findUnique.mockResolvedValue({
        eventType: 'SIGNUP',
        isLocked: false,
      });
      prisma.loyaltyRule.update.mockResolvedValue({ eventType: 'SIGNUP' });

      await service.updateRule('SIGNUP', { pointsPerThb: 0.5 }, 'admin');

      expect(prisma.loyaltyRule.update).toHaveBeenCalledWith({
        where: { eventType: 'SIGNUP' },
        data: {
          pointsPerThb: 0.5,
          updatedBy: 'admin',
        },
      });
    });
  });

  describe('getExpirySchedule', () => {
    it('should return aggregated expiry points grouped by month/year', async () => {
      prisma.pointHistory.findMany.mockResolvedValue([
        { amount: 10, expiresAt: new Date('2026-06-15') },
        { amount: 20, expiresAt: new Date('2026-06-20') },
        { amount: 30, expiresAt: new Date('2026-07-05') },
      ]);

      const result = await service.getExpirySchedule();

      expect(result).toEqual([
        { period: '06/2026', amount: 30 },
        { period: '07/2026', amount: 30 },
      ]);
    });
  });

  describe('processExpiries', () => {
    it('should calculate FIFO-based expiry and deduct from balance', async () => {
      // 1. groupExpiredEarns
      prisma.pointHistory.groupBy
        .mockResolvedValueOnce([
          { userId: 'user-1', _sum: { amount: 100 } },
        ])
        // 2. spentAndExpired
        .mockResolvedValueOnce([
          { type: PointTransactionType.REDEEM, _sum: { amount: -40 } },
          { type: PointTransactionType.EXPIRE, _sum: { amount: -10 } },
        ]);

      prisma.pointHistory.aggregate.mockResolvedValue({
        _sum: { amount: 50 },
      });

      // safeToRemove balance mock
      prisma.userPoint.findUnique.mockResolvedValue({
        userId: 'user-1',
        balance: 60,
      });

      const result = await service.processExpiries();

      // pointsToRemove = 100 (expired earns) - 40 (redeemed) - 10 (already expired) = 50
      expect(prisma.userPoint.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { balance: { decrement: 50 } },
      });
      expect(prisma.pointHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          amount: -50,
          type: PointTransactionType.EXPIRE,
        }),
      });

      expect(result).toEqual({
        usersProcessed: 1,
        totalPointsExpired: 50,
      });
    });
  });
});

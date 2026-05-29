import { Test, TestingModule } from '@nestjs/testing';
import { DealService } from './deal.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { createMockPrismaService } from '../../__tests__/test-utils';
import { RedemptionStatus } from '@prisma/client';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('DealService', () => {
  let service: DealService;
  let prisma: any;
  let loyaltyService: any;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    loyaltyService = {
      getUserBalance: jest.fn(),
      earnPoints: jest.fn(),
      redeemPoints: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: LoyaltyService,
          useValue: loyaltyService,
        },
      ],
    }).compile();

    service = module.get<DealService>(DealService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDeals', () => {
    it('should return active deals matching criteria with priority order', async () => {
      prisma.deal.findMany.mockResolvedValue([
        { id: 'deal-1', title: 'Active Deal 1', priority: 10 },
        { id: 'deal-2', title: 'Active Deal 2', priority: 5 },
      ]);

      const result = await service.getDeals({ search: 'Active' });

      expect(prisma.deal.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          isActive: true,
          OR: [
            { title: { contains: 'Active', mode: 'insensitive' } },
            { description: { contains: 'Active', mode: 'insensitive' } },
          ],
        }),
        include: { brand: true, category: true },
        orderBy: { priority: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('getDealDetail', () => {
    it('should throw NOT_FOUND error if deal does not exist', async () => {
      prisma.deal.findUnique.mockResolvedValue(null);

      await expect(service.getDealDetail('non-existent')).rejects.toThrow(
        new HttpException('Deal not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should return deal details if it exists', async () => {
      const mockDeal = { id: 'deal-1', title: 'Special Promo' };
      prisma.deal.findUnique.mockResolvedValue(mockDeal);

      const result = await service.getDealDetail('deal-1');

      expect(result).toEqual(mockDeal);
    });
  });

  describe('redeemDeal', () => {
    const mockDeal = {
      id: 'deal-1',
      title: 'Free Coffee',
      isActive: true,
      pointsRequired: 100,
      limitPerUser: 2,
      stock: 10,
      remainingStock: 10,
      startDate: null,
      endDate: null,
    };

    it('should throw if deal is inactive or not started or expired', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        ...mockDeal,
        isActive: false,
      });

      await expect(service.redeemDeal('user-1', 'deal-1')).rejects.toThrow(
        new HttpException('Deal is not available', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw if user exceeded limitPerUser', async () => {
      prisma.deal.findUnique.mockResolvedValue(mockDeal);
      prisma.dealRedemption.count.mockResolvedValue(2); // user already redeemed 2 times

      await expect(service.redeemDeal('user-1', 'deal-1')).rejects.toThrow(
        new HttpException('You have reached the limit for this deal', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw if user has insufficient points balance', async () => {
      prisma.deal.findUnique.mockResolvedValue(mockDeal);
      prisma.dealRedemption.count.mockResolvedValue(0);
      prisma.userPoint.updateMany.mockResolvedValue({ count: 0 }); // update returns 0 indicating insufficient balance

      await expect(service.redeemDeal('user-1', 'deal-1')).rejects.toThrow(
        new HttpException('Insufficient points or account error', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw if deal is out of stock', async () => {
      prisma.deal.findUnique.mockResolvedValue(mockDeal);
      prisma.dealRedemption.count.mockResolvedValue(0);
      prisma.userPoint.updateMany.mockResolvedValue({ count: 1 });
      prisma.deal.updateMany.mockResolvedValue({ count: 0 }); // out of stock

      await expect(service.redeemDeal('user-1', 'deal-1')).rejects.toThrow(
        new HttpException('Deal is out of stock', HttpStatus.BAD_REQUEST),
      );
    });

    it('should successfully deduct points, decrement stock, and create redemption', async () => {
      prisma.deal.findUnique.mockResolvedValue(mockDeal);
      prisma.dealRedemption.count.mockResolvedValue(0);
      prisma.userPoint.updateMany.mockResolvedValue({ count: 1 });
      prisma.deal.updateMany.mockResolvedValue({ count: 1 });
      prisma.dealRedemption.create.mockResolvedValue({
        id: 'redemp-1',
        redemptionCode: 'JLABC123XYZ',
        status: RedemptionStatus.REDEEMED,
      });

      const result = await service.redeemDeal('user-1', 'deal-1');

      expect(prisma.userPoint.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          balance: { gte: 100 },
        },
        data: {
          balance: { decrement: 100 },
        },
      });

      expect(prisma.deal.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'deal-1',
          remainingStock: { gt: 0 },
        },
        data: {
          remainingStock: { decrement: 1 },
        },
      });

      expect(prisma.dealRedemption.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            dealId: 'deal-1',
            pointsSpent: 100,
            status: RedemptionStatus.REDEEMED,
          }),
        }),
      );

      expect(prisma.pointHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          amount: -100,
          type: 'REDEEM',
          description: 'Redeemed: Free Coffee',
          referenceId: 'redemp-1',
        },
      });

      expect(result.redemptionCode).toBe('JLABC123XYZ');
    });
  });

  describe('createBrand', () => {
    it('should create a brand with appropriate fields', async () => {
      const brandDto = {
        name: 'Brand New',
        logoUrl: 'logo.png',
        description: 'Brand description',
        website: 'https://brand.com',
        partnerId: 'partner-123',
      };

      prisma.brand.create.mockResolvedValue({ id: 'brand-1', ...brandDto });

      const result = await service.createBrand(brandDto);

      expect(prisma.brand.create).toHaveBeenCalledWith({
        data: brandDto,
      });
      expect(result.id).toBe('brand-1');
    });
  });

  describe('createCategory', () => {
    it('should create a deal category', async () => {
      const categoryDto = {
        name: 'Food',
        description: 'Yummy food',
        iconUrl: 'food.png',
        order: 2,
      };

      prisma.dealCategory.create.mockResolvedValue({ id: 'cat-1', ...categoryDto });

      const result = await service.createCategory(categoryDto);

      expect(prisma.dealCategory.create).toHaveBeenCalledWith({
        data: categoryDto,
      });
      expect(result.id).toBe('cat-1');
    });
  });
});

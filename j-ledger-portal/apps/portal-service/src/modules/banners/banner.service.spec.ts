import { Test, TestingModule } from '@nestjs/testing';
import { BannerService } from './banner.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { createMockPrismaService } from '../../__tests__/test-utils';

describe('BannerService', () => {
  let service: BannerService;
  let prisma: any;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannerService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<BannerService>(BannerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveBanners', () => {
    it('should query prisma to find active banners with start/end date logic', async () => {
      prisma.banner.findMany.mockResolvedValue([
        { id: 'b1', title: 'Summer Sale', isActive: true },
      ]);

      const result = await service.getActiveBanners();

      expect(prisma.banner.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('b1');
    });
  });

  describe('getAllBanners', () => {
    it('should query prisma to find all banners ordered by createdAt desc', async () => {
      prisma.banner.findMany.mockResolvedValue([
        { id: 'b1', title: 'Promo A' },
        { id: 'b2', title: 'Promo B' },
      ]);

      const result = await service.getAllBanners();

      expect(prisma.banner.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('createBanner', () => {
    it('should create banner in prisma database', async () => {
      const bannerData = { title: 'New Promo', isActive: true };
      prisma.banner.create.mockResolvedValue({ id: 'b-new', ...bannerData });

      const result = await service.createBanner(bannerData);

      expect(prisma.banner.create).toHaveBeenCalledWith({
        data: bannerData,
      });
      expect(result.id).toBe('b-new');
    });
  });

  describe('updateBanner', () => {
    it('should update banner in prisma database by ID', async () => {
      const updateData = { title: 'Updated Promo' };
      prisma.banner.update.mockResolvedValue({ id: 'b-1', ...updateData });

      const result = await service.updateBanner('b-1', updateData);

      expect(prisma.banner.update).toHaveBeenCalledWith({
        where: { id: 'b-1' },
        data: updateData,
      });
      expect(result.title).toBe('Updated Promo');
    });
  });

  describe('deleteBanner', () => {
    it('should delete banner in prisma database by ID', async () => {
      prisma.banner.delete.mockResolvedValue({ id: 'b-1' });

      const result = await service.deleteBanner('b-1');

      expect(prisma.banner.delete).toHaveBeenCalledWith({
        where: { id: 'b-1' },
      });
      expect(result.id).toBe('b-1');
    });
  });
});

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { RedemptionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PaginationUtility } from '../../common/utils/pagination.util';
import {
  CreateBrandDto,
  UpdateBrandDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateDealDto,
  UpdateDealDto,
} from './dto/deal-admin.dto';

@Injectable()
export class DealService {
  private readonly logger = new Logger(DealService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  // ==================== User APIs ====================

  async getCategories() {
    return this.prisma.dealCategory.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async getDeals(filters: {
    categoryId?: string;
    brandId?: string;
    search?: string;
  }) {
    const where: any = {
      isActive: true,
      OR: [{ startDate: null }, { startDate: { lte: new Date() } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: new Date() } }] }],
    };

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.deal.findMany({
      where,
      include: { brand: true, category: true },
      orderBy: { priority: 'desc' },
    });
  }

  async getDealDetail(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: { brand: true, category: true },
    });
    if (!deal) throw new HttpException('Deal not found', HttpStatus.NOT_FOUND);
    return deal;
  }

  async redeemDeal(userId: string, dealId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Get Deal info (Plain fetch is fine as we use atomic updates later)
      const deal = await tx.deal.findUnique({
        where: { id: dealId },
      });

      if (!deal || !deal.isActive) {
        throw new HttpException(
          'Deal is not available',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check date availability
      const now = new Date();
      if (deal.startDate && deal.startDate > now) {
        throw new HttpException(
          'Deal has not started yet',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (deal.endDate && deal.endDate < now) {
        throw new HttpException('Deal has expired', HttpStatus.BAD_REQUEST);
      }

      // 2. Check User Limit
      const userRedemptions = await tx.dealRedemption.count({
        where: { userId, dealId },
      });

      if (userRedemptions >= deal.limitPerUser) {
        throw new HttpException(
          'You have reached the limit for this deal',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 3. Deduct Points via Atomic Conditional Update (Race Condition Protection)
      const pointUpdate = await tx.userPoint.updateMany({
        where: {
          userId,
          balance: { gte: deal.pointsRequired },
        },
        data: {
          balance: { decrement: deal.pointsRequired },
        },
      });

      if (pointUpdate.count === 0) {
        throw new HttpException(
          'Insufficient points or account error',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 4. Update Stock via Atomic Conditional Update (Race Condition Protection)
      if (deal.stock > 0) {
        const stockUpdate = await tx.deal.updateMany({
          where: {
            id: dealId,
            remainingStock: { gt: 0 },
          },
          data: {
            remainingStock: { decrement: 1 },
          },
        });

        if (stockUpdate.count === 0) {
          // Note: If we reach here, we've already deducted points!
          // But since we are in a $transaction, it will ROLLBACK. Safe!
          throw new HttpException(
            'Deal is out of stock',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // 6. Create Redemption
      // Generate professional 12-char alphanumeric code (avoiding ambiguous characters like O, 0, I, 1)
      const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let redemptionCode = 'JL';
      for (let i = 0; i < 10; i++) {
        redemptionCode += charset.charAt(
          Math.floor(Math.random() * charset.length),
        );
      }

      const redemption = await tx.dealRedemption.create({
        data: {
          userId,
          dealId,
          pointsSpent: deal.pointsRequired,
          redemptionCode,
          status: RedemptionStatus.REDEEMED,
          // Redemption usually valid for 30 days or until deal end date
          expiresAt:
            deal.endDate ||
            new Date(new Date().setDate(new Date().getDate() + 30)),
        },
      });

      // 7. Create Point History record
      await tx.pointHistory.create({
        data: {
          userId,
          amount: -deal.pointsRequired,
          type: 'REDEEM',
          description: `Redeemed: ${deal.title}`,
          referenceId: redemption.id,
        },
      });

      return redemption;
    });
  }

  async getMyRedemptions(userId: string) {
    return this.prisma.dealRedemption.findMany({
      where: { userId },
      include: { deal: { include: { brand: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async useRedemption(userId: string, redemptionId: string) {
    const redemption = await this.prisma.dealRedemption.findUnique({
      where: { id: redemptionId },
    });

    if (!redemption || redemption.userId !== userId) {
      throw new HttpException('Redemption not found', HttpStatus.NOT_FOUND);
    }

    if (redemption.status !== RedemptionStatus.REDEEMED) {
      throw new HttpException(
        'Deal already used or expired',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.dealRedemption.update({
      where: { id: redemptionId },
      data: {
        status: RedemptionStatus.USED,
        usedAt: new Date(),
      },
    });
  }

  async getRedemptionDetail(userId: string, redemptionId: string) {
    const redemption = await this.prisma.dealRedemption.findUnique({
      where: { id: redemptionId },
      include: { deal: { include: { brand: true } } },
    });

    if (!redemption || redemption.userId !== userId) {
      throw new HttpException('Redemption not found', HttpStatus.NOT_FOUND);
    }

    return redemption;
  }

  async getBrands() {
    return this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createBrand(data: CreateBrandDto) {
    return this.prisma.brand.create({
      data: {
        name: data.name,
        logoUrl: data.logoUrl,
        description: data.description,
        website: data.website,
        partnerId: data.partnerId,
      },
    });
  }

  async createCategory(data: CreateCategoryDto) {
    return this.prisma.dealCategory.create({
      data: {
        name: data.name,
        description: data.description,
        iconUrl: data.iconUrl,
        order: data.order || 0,
      },
    });
  }

  async updateBrand(id: string, data: UpdateBrandDto) {
    return this.prisma.brand.update({
      where: { id },
      data,
    });
  }

  async updateCategory(id: string, data: UpdateCategoryDto) {
    return this.prisma.dealCategory.update({
      where: { id },
      data,
    });
  }

  // ==================== Admin APIs ====================

  async createDeal(data: CreateDealDto) {
    const { brandId, categoryId, startDate, endDate, ...rest } = data;

    return this.prisma.deal.create({
      data: {
        ...rest,
        imageUrl: rest.imageUrl || '',
        startDate: startDate ? new Date(startDate + 'T00:00:00') : null,
        endDate: endDate ? new Date(endDate + 'T23:59:59') : null,
        brand: { connect: { id: brandId } },
        category: { connect: { id: categoryId } },
        remainingStock: data.stock,
      },
    });
  }

  async getDealsAdmin(filters: {
    categoryId?: string;
    brandId?: string;
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }

    return PaginationUtility.paginate(
      (opts) =>
        this.prisma.deal.findMany({
          where,
          ...opts,
          include: { brand: true, category: true },
        }),
      () => this.prisma.deal.count({ where }),
      {
        page: filters.page,
        limit: filters.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
    );
  }

  async updateDeal(id: string, data: UpdateDealDto) {
    const { brandId, categoryId, startDate, endDate, ...rest } = data;

    return this.prisma.$transaction(async (tx) => {
      const currentDeal = await tx.deal.findUnique({ where: { id } });
      if (!currentDeal)
        throw new HttpException('Deal not found', HttpStatus.NOT_FOUND);

      const { pointsRequired, ...updateDataWithoutPoints } = rest;

      const updateData: any = {
        ...updateDataWithoutPoints,
        imageUrl: rest.imageUrl || undefined,
        startDate: startDate ? new Date(startDate + 'T00:00:00') : null,
        endDate: endDate ? new Date(endDate + 'T23:59:59') : null,
        brand: brandId ? { connect: { id: brandId } } : undefined,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
      };

      // Intelligent Stock Update
      if (data.stock !== undefined && data.stock !== currentDeal.stock) {
        const stockDiff = data.stock - currentDeal.stock;
        // Adjust remaining stock by the same difference
        updateData.remainingStock = { increment: stockDiff };
      }

      return tx.deal.update({
        where: { id },
        data: updateData,
      });
    });
  }

  async deleteDeal(id: string) {
    return this.prisma.deal.delete({
      where: { id },
    });
  }

  async toggleDeal(id: string) {
    const deal = await this.prisma.deal.findUnique({ where: { id } });
    if (!deal) throw new HttpException('Deal not found', HttpStatus.NOT_FOUND);

    return this.prisma.deal.update({
      where: { id },
      data: { isActive: !deal.isActive },
    });
  }

  async getAllRedemptions(
    query: {
      page?: number;
      limit?: number;
      status?: string;
      dealId?: string;
      search?: string;
    } = {},
  ) {
    const where: any = {};

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.dealId) {
      where.dealId = query.dealId;
    }

    if (query.search) {
      // Find users matching search
      const matchedUsers = await this.prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: query.search, mode: 'insensitive' } },
            { phoneNumber: { contains: query.search, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });

      const userIds = matchedUsers.map((u) => u.id);

      where.OR = [
        { userId: { in: userIds } },
        { deal: { title: { contains: query.search, mode: 'insensitive' } } },
        { redemptionCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const result = await PaginationUtility.paginate(
      (opts) =>
        this.prisma.dealRedemption.findMany({
          where,
          ...opts,
          include: { deal: true },
        }),
      () => this.prisma.dealRedemption.count({ where }),
      {
        page: query.page,
        limit: query.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
    );

    const userIds = [...new Set(result.data.map((r) => r.userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, phoneNumber: true, email: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const data = result.data.map((r) => ({
      ...r,
      user: userMap.get(r.userId) || null,
    }));

    return {
      ...result,
      data,
    };
  }
}

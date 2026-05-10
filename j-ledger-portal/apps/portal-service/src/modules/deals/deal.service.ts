import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { RedemptionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

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
      // 1. Get Deal with Lock
      const deal = await tx.deal.findUnique({
        where: { id: dealId },
      });

      if (!deal || !deal.isActive) {
        throw new HttpException(
          'Deal is not available',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 2. Check Stock
      if (deal.stock > 0 && deal.remainingStock <= 0) {
        throw new HttpException('Deal is out of stock', HttpStatus.BAD_REQUEST);
      }

      // 3. Check User Limit
      const userRedemptions = await tx.dealRedemption.count({
        where: { userId, dealId },
      });

      if (userRedemptions >= deal.limitPerUser) {
        throw new HttpException(
          'You have reached the limit for this deal',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 4. Deduct Points via LoyaltyService logic (inside transaction)
      // We manually check balance here since tx is required
      const userPoint = await tx.userPoint.findUnique({ where: { userId } });
      if (!userPoint || userPoint.balance < deal.pointsRequired) {
        throw new HttpException('Insufficient points', HttpStatus.BAD_REQUEST);
      }

      await tx.userPoint.update({
        where: { userId },
        data: { balance: { decrement: deal.pointsRequired } },
      });

      // 5. Update Stock
      if (deal.stock > 0) {
        await tx.deal.update({
          where: { id: dealId },
          data: { remainingStock: { decrement: 1 } },
        });
      }

      // 6. Create Redemption
      const redemptionCode =
        `JL-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();

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

  // ==================== Admin APIs ====================

  async createDeal(data: any) {
    return this.prisma.deal.create({
      data: {
        ...data,
        remainingStock: data.stock,
      },
    });
  }

  async updateDeal(id: string, data: any) {
    return this.prisma.deal.update({
      where: { id },
      data,
    });
  }

  async deleteDeal(id: string) {
    return this.prisma.deal.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getAllRedemptions() {
    const redemptions = await this.prisma.dealRedemption.findMany({
      include: { deal: true },
      orderBy: { createdAt: 'desc' },
    });

    const userIds = [...new Set(redemptions.map((r) => r.userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, phoneNumber: true, email: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return redemptions.map((r) => ({
      ...r,
      user: userMap.get(r.userId) || null,
    }));
  }
}

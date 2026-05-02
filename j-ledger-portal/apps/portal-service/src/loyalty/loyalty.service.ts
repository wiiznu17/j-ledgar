import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointTransactionType } from '@prisma/client';

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);
  private readonly POINTS_PER_THB = 0.04; // 25 THB = 1 Point

  constructor(private readonly prisma: PrismaService) {}

  async getUserBalance(userId: string) {
    const points = await this.prisma.userPoint.findUnique({
      where: { userId },
    });
    return points || { balance: 0, lifetimePoints: 0 };
  }

  async getPointHistory(userId: string) {
    return this.prisma.pointHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async earnPoints(userId: string, amountThb: number, description: string, referenceId?: string) {
    const pointsToEarn = Math.floor(amountThb * this.POINTS_PER_THB);
    if (pointsToEarn <= 0) return null;

    this.logger.log(`User ${userId} earned ${pointsToEarn} points for: ${description}`);

    return this.prisma.$transaction(async (tx) => {
      // 1. Update or Create UserPoint balance
      const userPoint = await tx.userPoint.upsert({
        where: { userId },
        update: {
          balance: { increment: pointsToEarn },
          lifetimePoints: { increment: pointsToEarn },
        },
        create: {
          userId,
          balance: pointsToEarn,
          lifetimePoints: pointsToEarn,
        },
      });

      // 2. Create History record
      await tx.pointHistory.create({
        data: {
          userId,
          amount: pointsToEarn,
          type: PointTransactionType.EARN,
          description,
          referenceId,
          // Points expire in 1 year from now
          expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        },
      });

      return userPoint;
    });
  }

  async redeemPoints(userId: string, pointsToRedeem: number, description: string, referenceId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Check balance
      const userPoint = await tx.userPoint.findUnique({
        where: { userId },
      });

      if (!userPoint || userPoint.balance < pointsToRedeem) {
        throw new Error('Insufficient points balance');
      }

      // 2. Deduct points
      const updatedPoint = await tx.userPoint.update({
        where: { userId },
        data: {
          balance: { decrement: pointsToRedeem },
        },
      });

      // 3. Create History record
      await tx.pointHistory.create({
        data: {
          userId,
          amount: -pointsToRedeem,
          type: PointTransactionType.REDEEM,
          description,
          referenceId,
        },
      });

      return updatedPoint;
    });
  }
}

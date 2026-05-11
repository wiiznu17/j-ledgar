import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PointTransactionType } from '@prisma/client';
import { KafkaProducerService } from '../notification/kafka-producer.service';
import { KafkaTopic, NotificationEventType } from '@repo/dto';

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

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

  async getPointHistoryByReference(referenceId: string) {
    return this.prisma.pointHistory.findMany({
      where: { referenceId },
    });
  }

  async earnPoints(
    userId: string,
    amountThb: number,
    eventType: string,
    description: string,
    referenceId?: string,
  ) {
    // 1. Fetch dynamic rule from DB
    const rule = await this.prisma.loyaltyRule.findUnique({
      where: { eventType },
    });

    if (!rule || !rule.isActive) {
      this.logger.warn(`No active loyalty rule found for event: ${eventType}`);
      return null;
    }

    if (amountThb < rule.minAmount) {
      this.logger.debug(
        `Amount ${amountThb} is below minimum ${rule.minAmount} for ${eventType}`,
      );
      return null;
    }

    let pointsToEarn = Math.floor(amountThb * rule.pointsPerThb);

    // Apply max points cap if defined
    if (rule.maxPoints && pointsToEarn > rule.maxPoints) {
      pointsToEarn = rule.maxPoints;
    }

    if (pointsToEarn <= 0) return null;

    this.logger.log(
      `User ${userId} earned ${pointsToEarn} points for ${eventType}: ${description}`,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      // 2. Update or Create UserPoint balance
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

      // 3. Calculate Expiry (End of Month + 1 year)
      // Example: Earned in March 2025 -> Expires end of March 31, 2026
      const now = new Date();
      const year = now.getFullYear() + 1;
      const month = now.getMonth();
      const expiryDate = new Date(year, month + 1, 0, 23, 59, 59);

      // 4. Create History record
      const history = await tx.pointHistory.create({
        data: {
          userId,
          amount: pointsToEarn,
          type: PointTransactionType.EARN,
          description,
          referenceId,
          expiresAt: expiryDate,
        },
      });

      return { userPoint, pointsEarned: pointsToEarn, expiresAt: expiryDate };
    });

    // 5. Emit Kafka Event for Notification Worker
    try {
      const month = result.expiresAt.getMonth() + 1;
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const periodStr = `${monthStr}/${result.expiresAt.getFullYear()}`;
      
      await this.kafkaProducer.emit(KafkaTopic.LOYALTY_EVENTS, {
        userId,
        eventType: NotificationEventType.LOYALTY_EARN,
        referenceId,
        metadata: {
          points: result.pointsEarned,
          totalBalance: result.userPoint.balance,
          source: eventType,
          expiresPeriod: periodStr,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to emit LOYALTY_EARN to Kafka for user ${userId}: ${err.message}`,
      );
    }

    return result;
  }

  async redeemPoints(
    userId: string,
    pointsToRedeem: number,
    description: string,
    referenceId?: string,
  ) {
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

  // ==================== Admin APIs ====================

  async getEarnRules() {
    return this.prisma.loyaltyRule.findMany({
      orderBy: { eventType: 'asc' },
    });
  }

  async updateRule(
    eventType: string,
    data: {
      pointsPerThb?: number;
      minAmount?: number;
      maxPoints?: number;
      isActive?: boolean;
      isLocked?: boolean;
      description?: string;
    },
    updatedBy: string,
  ) {
    const existing = await this.prisma.loyaltyRule.findUnique({
      where: { eventType },
    });

    if (!existing) throw new Error('Rule not found');

    // If locked, only allow unlocking (isLocked: false)
    if (existing.isLocked && data.isLocked !== false) {
      throw new Error(
        'Rule is locked. Please enter Maintenance Mode to modify.',
      );
    }

    return this.prisma.loyaltyRule.update({
      where: { eventType },
      data: {
        ...data,
        updatedBy,
      },
    });
  }

  async getLoyaltyStats() {
    const [pointsStats, userCount, rules, usageStats] = await Promise.all([
      this.prisma.userPoint.aggregate({
        _sum: {
          balance: true,
          lifetimePoints: true,
        },
      }),
      this.prisma.userPoint.count(),
      this.prisma.loyaltyRule.count(),
      this.prisma.pointHistory.groupBy({
        by: ['type'],
        _sum: {
          amount: true,
        },
        where: {
          type: {
            in: [PointTransactionType.REDEEM, PointTransactionType.EXPIRE],
          },
        },
      }),
    ]);

    const totalRedeemed = Math.abs(
      usageStats.find((s) => s.type === PointTransactionType.REDEEM)?._sum
        .amount || 0,
    );
    const totalExpired = Math.abs(
      usageStats.find((s) => s.type === PointTransactionType.EXPIRE)?._sum
        .amount || 0,
    );

    return {
      totalActivePoints: pointsStats._sum.balance || 0,
      totalLifetimePoints: pointsStats._sum.lifetimePoints || 0,
      totalRedeemedPoints: totalRedeemed,
      totalExpiredPoints: totalExpired,
      totalUsersWithPoints: userCount,
      activeRules: rules,
    };
  }

  async getExpirySchedule() {
    // Group expiring points by quarter
    const history = await this.prisma.pointHistory.findMany({
      where: {
        type: PointTransactionType.EARN,
        expiresAt: { gt: new Date() },
      },
      select: {
        amount: true,
        expiresAt: true,
      },
    });

    const schedule = history.reduce((acc: any, item) => {
      if (!item.expiresAt) return acc;
      const month = item.expiresAt.getMonth() + 1;
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const period = `${monthStr}/${item.expiresAt.getFullYear()}`;
      acc[period] = (acc[period] || 0) + item.amount;
      return acc;
    }, {});

    return Object.entries(schedule)
      .map(([period, amount]) => ({ period, amount }))
      .sort((a, b) => {
        const [m1, y1] = a.period.split('/');
        const [m2, y2] = b.period.split('/');
        return `${y1}${m1}`.localeCompare(`${y2}${m2}`);
      });
  }

  /**
   * Batch process for points expiry.
   * Calculates how many points from expired EARN records are still in the balance
   * using a FIFO-based assumption.
   */
  async processExpiries() {
    const now = new Date();
    
    // 1. Find all users with expired earn records
    const expiredEarns = await this.prisma.pointHistory.groupBy({
      by: ['userId'],
      _sum: {
        amount: true,
      },
      where: {
        type: PointTransactionType.EARN,
        expiresAt: { lte: now },
      },
    });

    let usersProcessed = 0;
    let totalPointsExpired = 0;

    for (const record of expiredEarns) {
      const userId = record.userId;
      const pointsEarnedExpired = record._sum.amount || 0;

      // 2. Get total redeemed and total already expired for this user
      const totals = await this.prisma.pointHistory.aggregate({
        where: { userId },
        _sum: {
          amount: true,
        },
      });

      // We need to specifically count REDEEM and EXPIRE types to see how much was already taken from balance
      const spentAndExpired = await this.prisma.pointHistory.groupBy({
        by: ['type'],
        where: {
          userId,
          type: { in: [PointTransactionType.REDEEM, PointTransactionType.EXPIRE] },
        },
        _sum: {
          amount: true,
        },
      });

      const totalRedeemed = Math.abs(spentAndExpired.find(s => s.type === PointTransactionType.REDEEM)?._sum.amount || 0);
      const totalAlreadyExpired = Math.abs(spentAndExpired.find(s => s.type === PointTransactionType.EXPIRE)?._sum.amount || 0);

      // Amount to expire = Earned(Expired) - Redeemed - AlreadyExpired
      // Since redemptions consume oldest points first (FIFO assumption)
      const pointsToRemove = Math.max(0, pointsEarnedExpired - totalRedeemed - totalAlreadyExpired);

      if (pointsToRemove > 0) {
        await this.prisma.$transaction(async (tx) => {
          // Double check current balance to avoid negative balance (safety net)
          const userPoint = await tx.userPoint.findUnique({ where: { userId } });
          const safeToRemove = Math.min(pointsToRemove, userPoint?.balance || 0);

          if (safeToRemove > 0) {
            await tx.userPoint.update({
              where: { userId },
              data: {
                balance: { decrement: safeToRemove },
              },
            });

            await tx.pointHistory.create({
              data: {
                userId,
                amount: -safeToRemove,
                type: PointTransactionType.EXPIRE,
                description: `Points expired (Monthly cycle)`,
              },
            });

            totalPointsExpired += safeToRemove;
          }
        });
      }
      usersProcessed++;
    }

    return { usersProcessed, totalPointsExpired };
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { KafkaProducerService } from './kafka-producer.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async getNotifications(userId: string, page: number = 1, limit: number = 20, category?: string) {
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (category && category !== 'ALL') {
      // Define legacy type mapping for each category
      const typeMapping: Record<string, string[]> = {
        FINANCE: ['TRANSFER', 'TOPUP', 'PAYMENT', 'FINANCE'],
        SYSTEM: ['SECURITY', 'KYC_STATUS', 'SYSTEM'],
        PROMO: ['PROMO', 'OFFER'],
        NEWS: ['NEWS', 'ANNOUNCEMENT'],
      };

      const mappedTypes = typeMapping[category] || [];

      // Query for either the specific category OR a legacy type with null category
      where.OR = [
        { category },
        {
          category: null,
          type: { in: mappedTypes },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async updateDevicePushToken(userId: string, deviceIdentifier: string, pushToken: string) {
    const result = await this.prisma.userDevice.upsert({
      where: { userId_deviceIdentifier: { userId, deviceIdentifier } },
      update: { pushToken, lastSeenAt: new Date() },
      create: {
        userId,
        deviceIdentifier,
        pushToken,
        lastSeenAt: new Date(),
        trustLevel: 'TRUSTED',
      },
    });

    // Enforce 1 User = 1 Device for Notifications: Remove other devices
    await this.prisma.userDevice.deleteMany({
      where: {
        userId,
        deviceIdentifier: { not: deviceIdentifier },
      },
    });

    return result;
  }

  async updatePreferences(
    userId: string,
    prefs: { pushEnabled?: boolean; emailEnabled?: boolean },
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: prefs,
      create: {
        userId,
        ...prefs,
      },
    });
  }

  async getPreferences(userId: string) {
    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      // Return defaults
      prefs = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return prefs;
  }
}

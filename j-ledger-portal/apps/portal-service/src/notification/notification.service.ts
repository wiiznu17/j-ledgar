import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KafkaProducerService } from './kafka-producer.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async getNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
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
    const device = await this.prisma.userDevice.findUnique({
      where: { userId_deviceIdentifier: { userId, deviceIdentifier } },
    });

    if (!device) {
      throw new NotFoundException('Device not registered');
    }

    return this.prisma.userDevice.update({
      where: { id: device.id },
      data: { pushToken },
    });
  }

  async updatePreferences(userId: string, prefs: { pushEnabled?: boolean; emailEnabled?: boolean }) {
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

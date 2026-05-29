import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { KafkaProducerService } from './kafka-producer.service';
import {
  createMockPrismaService,
  createMockKafkaProducer,
} from '../../__tests__/test-utils';
import { NotFoundException } from '@nestjs/common';

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: any;
  let kafkaProducer: any;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    kafkaProducer = createMockKafkaProducer();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
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

    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should retrieve notifications with pagination and metadata without category', async () => {
      prisma.notification.findMany.mockResolvedValue([
        { id: 'notif-1', isRead: false },
        { id: 'notif-2', isRead: true },
      ]);
      prisma.notification.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5); // unreadCount

      const result = await service.getNotifications('user-1', 2, 5);

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        skip: 5,
        take: 5,
      });

      expect(result.items).toHaveLength(2);
      expect(result.meta.total).toBe(10);
      expect(result.meta.unreadCount).toBe(5);
      expect(result.meta.totalPages).toBe(2);
    });

    it('should map legacy categories and apply OR filter when FINANCE category is selected', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.notification.count.mockResolvedValue(0);

      await service.getNotifications('user-1', 1, 10, 'FINANCE');

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { category: 'FINANCE' },
              {
                category: null,
                type: { in: ['TRANSFER', 'TOPUP', 'PAYMENT', 'FINANCE'] },
              },
            ],
          }),
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read in database', async () => {
      prisma.notification.findFirst.mockResolvedValue({ id: 'notif-123', userId: 'user-1', isRead: false });
      prisma.notification.update.mockResolvedValue({ id: 'notif-123', isRead: true });

      const result = await service.markAsRead('user-1', 'notif-123');

      expect(prisma.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'notif-123', userId: 'user-1' },
      });
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-123' },
        data: { isRead: true },
      });
      expect(result.isRead).toBe(true);
    });

    it('should throw NotFoundException if notification is not found', async () => {
      prisma.notification.findFirst.mockResolvedValue(null);

      await expect(
        service.markAsRead('user-1', 'notif-invalid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateDevicePushToken', () => {
    it('should upsert push token and delete other devices for device deduplication', async () => {
      prisma.userDevice.upsert.mockResolvedValue({ id: 'device-1', pushToken: 'token-abc' });

      const result = await service.updateDevicePushToken('user-1', 'uuid-dev-123', 'token-abc');

      expect(prisma.userDevice.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_deviceIdentifier: { userId: 'user-1', deviceIdentifier: 'uuid-dev-123' } },
          update: expect.objectContaining({ pushToken: 'token-abc' }),
          create: expect.objectContaining({ pushToken: 'token-abc' }),
        }),
      );

      expect(prisma.userDevice.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          deviceIdentifier: { not: 'uuid-dev-123' },
        },
      });

      expect(result.pushToken).toBe('token-abc');
    });
  });

  describe('Notification Preferences', () => {
    it('should upsert preference settings in database', async () => {
      prisma.notificationPreference.upsert.mockResolvedValue({ userId: 'user-1', pushEnabled: true });

      const result = await service.updatePreferences('user-1', { pushEnabled: true });

      expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        update: { pushEnabled: true },
        create: { userId: 'user-1', pushEnabled: true },
      });
      expect(result.pushEnabled).toBe(true);
    });

    it('should return user preferences if they exist', async () => {
      prisma.notificationPreference.findUnique.mockResolvedValue({ userId: 'user-1', pushEnabled: false });

      const result = await service.getPreferences('user-1');

      expect(result.pushEnabled).toBe(false);
      expect(prisma.notificationPreference.create).not.toHaveBeenCalled();
    });

    it('should create and return default preferences if none exist', async () => {
      prisma.notificationPreference.findUnique.mockResolvedValue(null);
      prisma.notificationPreference.create.mockResolvedValue({ userId: 'user-1', pushEnabled: true, emailEnabled: true });

      const result = await service.getPreferences('user-1');

      expect(prisma.notificationPreference.create).toHaveBeenCalledWith({
        data: { userId: 'user-1' },
      });
      expect(result.pushEnabled).toBe(true);
    });
  });
});

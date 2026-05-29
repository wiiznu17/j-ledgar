import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { PushService } from '../push/push.service';
import {
  NotificationEventType,
  KafkaTopic,
  NotificationCategory,
  AppPath,
} from '@repo/dto';

jest.mock('expo-server-sdk', () => {
  return {
    Expo: jest.fn().mockImplementation(() => {
      return {
        chunkPushNotifications: jest.fn(),
        sendPushNotificationsAsync: jest.fn(),
      };
    }),
  };
});

const createMockPrismaService = () => {
  const mockMethods = {
    $transaction: jest.fn((cb) => {
      if (typeof cb === 'function') {
        return cb(mockPrisma);
      }
      return Promise.resolve(cb);
    }),
  };

  const handler = {
    get(target: any, prop: string) {
      if (prop in mockMethods) {
        return (mockMethods as any)[prop];
      }
      if (!target[prop]) {
        target[prop] = new Proxy({}, {
          get(modelTarget: any, modelProp: string) {
            if (!modelTarget[modelProp]) {
              modelTarget[modelProp] = jest.fn().mockResolvedValue(null);
            }
            return modelTarget[modelProp];
          }
        });
      }
      return target[prop];
    }
  };

  const mockPrisma = new Proxy({}, handler);
  return mockPrisma;
};

describe('NotificationService (Worker)', () => {
  let service: NotificationService;
  let prisma: any;
  let emailService: any;
  let pushService: any;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    emailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };
    pushService = {
      sendPushNotification: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: EmailService,
          useValue: emailService,
        },
        {
          provide: PushService,
          useValue: pushService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleEvent', () => {
    it('should skip processing if notification is silent', async () => {
      const payload = {
        userId: 'user-1',
        eventType: NotificationEventType.TOPUP,
        metadata: { silent: true },
      };

      await service.handleEvent(KafkaTopic.TRANSACTION_EVENTS, payload);

      expect(prisma.notification.findUnique).not.toHaveBeenCalled();
      expect(pushService.sendPushNotification).not.toHaveBeenCalled();
    });

    it('should skip persistence but send push if the notification is a duplicate (existing found)', async () => {
      const payload = {
        userId: 'user-1',
        eventType: NotificationEventType.PASSWORD_CHANGE,
        referenceId: 'ref-1',
      };

      prisma.notification.findUnique.mockResolvedValue({ id: 'notif-exist' });
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });
      prisma.userDevice.findMany.mockResolvedValue([{ pushToken: 'push-token-1' }]);

      await service.handleEvent(KafkaTopic.SECURITY_EVENTS, payload);

      expect(prisma.notification.findUnique).toHaveBeenCalled();
      expect(prisma.notification.create).not.toHaveBeenCalled();
      expect(pushService.sendPushNotification).toHaveBeenCalledWith(
        'push-token-1',
        'Security Alert: Password Updated',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should persist new notifications, dispatch push notifications, and skip email if push succeeds', async () => {
      const payload = {
        userId: 'user-1',
        eventType: NotificationEventType.TOPUP,
        amount: 500,
        referenceId: 'ref-topup',
        metadata: { source: 'Stripe' },
      };

      prisma.notification.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'user@example.com' });
      prisma.notificationPreference.findUnique.mockResolvedValue({ userId: 'user-1', pushEnabled: true });
      prisma.userDevice.findMany.mockResolvedValue([{ pushToken: 'push-token-123' }]);

      await service.handleEvent(KafkaTopic.TRANSACTION_EVENTS, payload);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          type: NotificationEventType.TOPUP,
          category: NotificationCategory.FINANCE,
          referenceId: 'ref-topup',
        }),
      });

      expect(pushService.sendPushNotification).toHaveBeenCalledWith(
        'push-token-123',
        'Wallet Top-up',
        expect.stringContaining('฿500.00'),
        expect.any(Object)
      );

      // Email should be skipped because push was successfully sent
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should fallback to sending email if push notification fails to dispatch', async () => {
      const payload = {
        userId: 'user-2',
        eventType: NotificationEventType.KYC_REJECTED,
        referenceId: 'ref-kyc',
        metadata: { reason: 'blurry ID card' },
      };

      prisma.notification.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ id: 'user-2', email: 'user2@example.com' });
      prisma.notificationPreference.findUnique.mockResolvedValue({ userId: 'user-2', emailEnabled: true });
      prisma.userDevice.findMany.mockResolvedValue([{ pushToken: 'push-token-bad' }]);

      // Simulate push failure
      pushService.sendPushNotification.mockResolvedValue(false);

      await service.handleEvent(KafkaTopic.KYC_EVENTS, payload);

      expect(prisma.notification.create).toHaveBeenCalled();
      expect(pushService.sendPushNotification).toHaveBeenCalled();
      // Expect fallback email to be dispatched
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'user2@example.com',
        'Identity Verification',
        expect.stringContaining('blurry ID card')
      );
    });

    it('should pull sender name from database during money received transfer if senderName is missing in metadata', async () => {
      const payload = {
        userId: 'receiver-1',
        eventType: NotificationEventType.TRANSFER,
        amount: 250,
        referenceId: 'ref-transfer',
        metadata: { isReceiver: true, senderUserId: 'sender-99' },
      };

      prisma.notification.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue({ id: 'receiver-1', email: 'rec@example.com' });
      prisma.notificationPreference.findUnique.mockResolvedValue({ userId: 'receiver-1', pushEnabled: true });
      prisma.userDevice.findMany.mockResolvedValue([{ pushToken: 'push-token-rec' }]);

      // Mock sender PII profile
      prisma.kYCData.findUnique.mockResolvedValue({
        idCardName: 'Somchai Jaidee',
      });

      await service.handleEvent(KafkaTopic.TRANSACTION_EVENTS, payload);

      expect(prisma.kYCData.findUnique).toHaveBeenCalledWith({
        where: { userId: 'sender-99' },
      });

      expect(pushService.sendPushNotification).toHaveBeenCalledWith(
        'push-token-rec',
        'Money Received',
        expect.stringContaining('received ฿250.00 from Somchai Jaidee'),
        expect.any(Object)
      );
    });
  });
});

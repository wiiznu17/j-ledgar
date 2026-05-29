import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from './kafka.service';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from '../notification/notification.service';
import { EmailService } from '../email/email.service';
import { KafkaTopic } from '@repo/dto';

const mockConsumer = {
  connect: jest.fn(),
  subscribe: jest.fn(),
  run: jest.fn(),
  disconnect: jest.fn(),
};

const mockKafkaInstance = {
  consumer: jest.fn().mockReturnValue(mockConsumer),
};

jest.mock('kafkajs', () => {
  return {
    Kafka: jest.fn().mockImplementation(() => mockKafkaInstance),
  };
});

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

describe('KafkaService (Worker)', () => {
  let service: KafkaService;
  let configService: any;
  let notificationService: any;
  let emailService: any;
  let eachMessageCallback: any;

  beforeEach(async () => {
    mockConsumer.connect.mockReset();
    mockConsumer.subscribe.mockReset();
    mockConsumer.disconnect.mockReset();
    mockConsumer.run.mockReset();

    mockConsumer.run.mockImplementation(async (options: any) => {
      eachMessageCallback = options.eachMessage;
    });

    configService = {
      get: jest.fn((key: string, def?: any) => {
        if (key === 'KAFKA_BROKERS') return 'localhost:9092';
        if (key === 'KAFKA_CONSUMER_GROUP') return 'notification-worker';
        return def;
      }),
    };

    notificationService = {
      handleEvent: jest.fn().mockResolvedValue(undefined),
    };

    emailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaService,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: NotificationService,
          useValue: notificationService,
        },
        {
          provide: EmailService,
          useValue: emailService,
        },
      ],
    }).compile();

    service = module.get<KafkaService>(KafkaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Lifecycle Hooks', () => {
    it('should connect consumer, subscribe to topics, and start run loop', async () => {
      await service.onModuleInit();

      expect(mockConsumer.connect).toHaveBeenCalled();
      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topics: [
          KafkaTopic.FINANCIAL_EVENTS_V1,
          KafkaTopic.TRANSACTION_EVENTS,
          KafkaTopic.KYC_EVENTS,
          KafkaTopic.SECURITY_EVENTS,
          KafkaTopic.LOYALTY_EVENTS,
        ],
      });
      expect(mockConsumer.run).toHaveBeenCalledWith(
        expect.objectContaining({
          eachMessage: expect.any(Function),
        })
      );
    });

    it('should disconnect consumer on destroy', async () => {
      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(mockConsumer.disconnect).toHaveBeenCalled();
    });
  });

  describe('Message Processing', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should forward normal transactional events to NotificationService.handleEvent', async () => {
      const payload = { userId: 'user-1', eventType: 'TOPUP', amount: 300 };
      const message = { value: Buffer.from(JSON.stringify(payload)) };

      await eachMessageCallback({
        topic: KafkaTopic.TRANSACTION_EVENTS,
        partition: 0,
        message,
      });

      expect(notificationService.handleEvent).toHaveBeenCalledWith(
        KafkaTopic.TRANSACTION_EVENTS,
        payload
      );
    });

    it('should intercept security ADMIN_INVITE type and send setup email directly', async () => {
      const payload = {
        userId: 'admin-1',
        eventType: 'ADMIN_INVITE',
        metadata: {
          email: 'admin@jledger.io',
          setupLink: 'http://setup-link',
        },
      };
      const message = { value: Buffer.from(JSON.stringify(payload)) };

      await eachMessageCallback({
        topic: KafkaTopic.SECURITY_EVENTS,
        partition: 0,
        message,
      });

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'admin@jledger.io',
        'Welcome to J-Ledger Admin Portal!',
        expect.stringContaining('http://setup-link')
      );
      expect(notificationService.handleEvent).not.toHaveBeenCalled();
    });

    it('should intercept security ADMIN_PASSWORD_RESET type and send reset email directly', async () => {
      const payload = {
        userId: 'admin-1',
        eventType: 'ADMIN_PASSWORD_RESET',
        metadata: {
          email: 'admin@jledger.io',
          resetLink: 'http://reset-link',
        },
      };
      const message = { value: Buffer.from(JSON.stringify(payload)) };

      await eachMessageCallback({
        topic: KafkaTopic.SECURITY_EVENTS,
        partition: 0,
        message,
      });

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'admin@jledger.io',
        'Reset your J-Ledger Admin Password',
        expect.stringContaining('http://reset-link')
      );
      expect(notificationService.handleEvent).not.toHaveBeenCalled();
    });

    it('should gracefully catch and log errors if handling message fails', async () => {
      const payload = { userId: 'user-1' };
      const message = { value: Buffer.from(JSON.stringify(payload)) };
      
      notificationService.handleEvent.mockRejectedValue(new Error('DB Timeout'));
      const loggerSpy = jest.spyOn((service as any).logger, 'error');

      await eachMessageCallback({
        topic: KafkaTopic.TRANSACTION_EVENTS,
        partition: 0,
        message,
      });

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Error processing message on topic'));
    });
  });
});

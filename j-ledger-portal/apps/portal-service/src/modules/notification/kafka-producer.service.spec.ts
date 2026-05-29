import { Test, TestingModule } from '@nestjs/testing';
import { KafkaProducerService } from './kafka-producer.service';
import { ConfigService } from '@nestjs/config';
import { createMockConfigService } from '../../__tests__/test-utils';

const mockProducer = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  send: jest.fn(),
};

const mockKafkaInstance = {
  producer: jest.fn().mockReturnValue(mockProducer),
};

jest.mock('kafkajs', () => {
  return {
    Kafka: jest.fn().mockImplementation(() => mockKafkaInstance),
  };
});

describe('KafkaProducerService', () => {
  let service: KafkaProducerService;
  let configService: any;

  beforeEach(async () => {
    configService = createMockConfigService({
      KAFKA_BROKERS: 'broker1:9092,broker2:9092',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaProducerService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<KafkaProducerService>(KafkaProducerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should connect to Kafka producer successfully', async () => {
      mockProducer.connect.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockProducer.connect).toHaveBeenCalled();
    });

    it('should log an error when Kafka connection fails', async () => {
      const error = new Error('Kafka Connection Timeout');
      mockProducer.connect.mockRejectedValue(error);
      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

      await service.onModuleInit();

      expect(mockProducer.connect).toHaveBeenCalled();
      expect(loggerErrorSpy).toHaveBeenCalledWith('Failed to connect Kafka Producer', error);
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from Kafka producer successfully', async () => {
      mockProducer.disconnect.mockResolvedValue(undefined);

      await service.onModuleDestroy();

      expect(mockProducer.disconnect).toHaveBeenCalled();
    });
  });

  describe('emit', () => {
    it('should stringify payload and send it to specified Kafka topic', async () => {
      mockProducer.send.mockResolvedValue(undefined);
      const payload = { userId: 'user-1', status: 'COMPLETED' };

      await service.emit('my-test-topic', payload);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: 'my-test-topic',
        messages: [{ value: JSON.stringify(payload) }],
      });
    });

    it('should log an error when sending event to Kafka fails', async () => {
      const error = new Error('Broker Unavailable');
      mockProducer.send.mockRejectedValue(error);
      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');
      const payload = { test: 123 };

      await service.emit('my-test-topic', payload);

      expect(mockProducer.send).toHaveBeenCalled();
      expect(loggerErrorSpy).toHaveBeenCalledWith('Failed to emit event to my-test-topic', error);
    });
  });
});

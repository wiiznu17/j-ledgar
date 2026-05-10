import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { NotificationService } from '../notification/notification.service';
import { KafkaTopic } from '@repo/dto';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private configService: ConfigService,
    private notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    const brokers = this.configService
      .get('KAFKA_BROKERS', 'localhost:9092')
      .split(',');
    const groupId = this.configService.get(
      'KAFKA_CONSUMER_GROUP',
      'notification-worker',
    );

    this.kafka = new Kafka({
      clientId: 'notification-worker',
      brokers,
    });

    this.consumer = this.kafka.consumer({ groupId });

    await this.consumer.connect();
    await this.consumer.subscribe({
      topics: [
        KafkaTopic.FINANCIAL_EVENTS_V1,
        KafkaTopic.TRANSACTION_EVENTS,
        KafkaTopic.KYC_EVENTS,
        KafkaTopic.SECURITY_EVENTS,
      ],
    });

    await this.consumer.run({
      eachMessage: async ({
        topic,
        partition,
        message,
      }: EachMessagePayload) => {
        try {
          const value = message.value?.toString();
          if (value) {
            await this.handleMessage(topic, JSON.parse(value));
          }
        } catch (error) {
          this.logger.error(
            `Error processing message on topic ${topic}: ${error.message}`,
          );
        }
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }

  private async handleMessage(topic: string, payload: any) {
    this.logger.debug(
      `Received message on topic ${topic} for user ${payload.userId}`,
    );
    await this.notificationService.handleEvent(topic, payload);
  }
}

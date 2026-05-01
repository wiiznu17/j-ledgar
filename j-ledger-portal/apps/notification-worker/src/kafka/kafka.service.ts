import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private configService: ConfigService,
    private notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    const brokers = this.configService.get('KAFKA_BROKERS', 'localhost:9092').split(',');
    const groupId = this.configService.get('KAFKA_CONSUMER_GROUP', 'notification-worker');

    this.kafka = new Kafka({
      clientId: 'notification-worker',
      brokers,
    });

    this.consumer = this.kafka.consumer({ groupId });

    await this.consumer.connect();
    await this.consumer.subscribe({ topics: ['transaction-events', 'kyc-events', 'security-events'] });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        const value = message.value?.toString();
        if (value) {
          await this.handleMessage(topic, JSON.parse(value));
        }
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }

  private async handleMessage(topic: string, payload: any) {
    await this.notificationService.handleEvent(topic, payload);
  }
}

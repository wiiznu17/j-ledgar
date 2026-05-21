import { Injectable, Logger } from '@nestjs/common';
import { KafkaProducerService } from '../../modules/notification/kafka-producer.service';
import { KafkaTopic } from '@repo/dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  /**
   * Publish an admin invitation email event to Kafka.
   */
  async sendAdminInvite(email: string, token: string): Promise<void> {
    const adminWebUrl = process.env.ADMIN_WEB_URL || 'http://localhost:3002';
    const setupLink = `${adminWebUrl}/setup-account?token=${token}&email=${encodeURIComponent(email)}`;

    this.logger.log(`Publishing ADMIN_INVITE event to Kafka for ${email}`);

    try {
      await this.kafkaProducer.emit(KafkaTopic.SECURITY_EVENTS, {
        userId: 'SYSTEM',
        eventType: 'ADMIN_INVITE',
        metadata: {
          email,
          setupLink,
        },
        timestamp: new Date().toISOString(),
        referenceId: `invite-${Date.now()}`,
      });
      this.logger.log(`ADMIN_INVITE event published to Kafka successfully.`);
    } catch (error) {
      this.logger.error(
        `Failed to publish ADMIN_INVITE event: ${error.message}`,
      );
    }
  }

  /**
   * Publish a password reset email event to Kafka.
   */
  async sendPasswordReset(email: string, token: string): Promise<void> {
    const adminWebUrl = process.env.ADMIN_WEB_URL || 'http://localhost:3002';
    const resetLink = `${adminWebUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    this.logger.log(
      `Publishing ADMIN_PASSWORD_RESET event to Kafka for ${email}`,
    );

    try {
      await this.kafkaProducer.emit(KafkaTopic.SECURITY_EVENTS, {
        userId: 'SYSTEM',
        eventType: 'ADMIN_PASSWORD_RESET',
        metadata: {
          email,
          resetLink,
        },
        timestamp: new Date().toISOString(),
        referenceId: `reset-${Date.now()}`,
      });
      this.logger.log(
        `ADMIN_PASSWORD_RESET event published to Kafka successfully.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish ADMIN_PASSWORD_RESET event: ${error.message}`,
      );
    }
  }
}

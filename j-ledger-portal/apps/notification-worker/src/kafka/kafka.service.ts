import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { NotificationService } from '../notification/notification.service';
import { EmailService } from '../email/email.service';
import { KafkaTopic } from '@repo/dto';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private configService: ConfigService,
    private notificationService: NotificationService,
    private emailService: EmailService,
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
        KafkaTopic.LOYALTY_EVENTS,
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

    if (topic === KafkaTopic.SECURITY_EVENTS) {
      const { eventType, metadata } = payload;
      if (eventType === 'ADMIN_INVITE') {
        const { email, setupLink } = metadata;
        this.logger.log(`Processing ADMIN_INVITE for ${email}`);
        const html = `
          <div style="background-color: #F5F7FB; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <div style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);">
              <div style="background-color: #BF3FFF; height: 6px;"></div>
              <div style="padding: 40px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <span style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #2D3748;">J-LEDGER</span>
                  <span style="font-size: 10px; font-weight: 700; color: #64748B; display: block; margin-top: 4px; letter-spacing: 1px;">ADMIN PORTAL</span>
                </div>
                <h2 style="font-size: 20px; font-weight: 700; color: #2D3748; margin-top: 0; margin-bottom: 12px; text-align: center;">Welcome to J-Ledger</h2>
                <p style="font-size: 15px; color: #4A5568; line-height: 1.6; margin-bottom: 24px; text-align: center;">You have been invited to join the J-Ledger administrator team. Please click the button below to set up your password and activate your account.</p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${setupLink}" style="background-color: #BF3FFF; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(191, 63, 255, 0.2);">Set Up Your Account</a>
                </div>
                <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; margin: 24px 0;">
                  <span style="font-size: 12px; color: #64748B; display: block; margin-bottom: 6px; font-weight: 600;">Or copy this link into your browser:</span>
                  <a href="${setupLink}" style="word-break: break-all; color: #BF3FFF; font-size: 13px; text-decoration: none; font-weight: 500;">${setupLink}</a>
                </div>
                <div style="border-top: 1px solid #E2E8F0; margin-top: 32px; padding-top: 24px;">
                  <p style="color: #94A3B8; font-size: 12px; line-height: 1.5; text-align: center; margin: 0;">This activation link will expire in 24 hours for security purposes.<br>If you did not request this invitation, please ignore this email.</p>
                </div>
              </div>
            </div>
          </div>
        `;
        try {
          await this.emailService.sendEmail(
            email,
            'Welcome to J-Ledger Admin Portal!',
            html,
          );
          this.logger.log(`Successfully sent ADMIN_INVITE email to ${email}`);
        } catch (error) {
          this.logger.error(
            `Failed to send ADMIN_INVITE email: ${error.message}`,
          );
        }
        return;
      }

      if (eventType === 'ADMIN_PASSWORD_RESET') {
        const { email, resetLink } = metadata;
        this.logger.log(`Processing ADMIN_PASSWORD_RESET for ${email}`);
        const html = `
          <div style="background-color: #F5F7FB; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <div style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);">
              <div style="background-color: #BF3FFF; height: 6px;"></div>
              <div style="padding: 40px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <span style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #2D3748;">J-LEDGER</span>
                  <span style="font-size: 10px; font-weight: 700; color: #64748B; display: block; margin-top: 4px; letter-spacing: 1px;">ADMIN PORTAL</span>
                </div>
                <h2 style="font-size: 20px; font-weight: 700; color: #2D3748; margin-top: 0; margin-bottom: 12px; text-align: center;">Password Reset Request</h2>
                <p style="font-size: 15px; color: #4A5568; line-height: 1.6; margin-bottom: 24px; text-align: center;">We received a request to reset the password for your administrator account. Please click the button below to define a new password.</p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${resetLink}" style="background-color: #BF3FFF; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(191, 63, 255, 0.2);">Reset Password</a>
                </div>
                <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; margin: 24px 0;">
                  <span style="font-size: 12px; color: #64748B; display: block; margin-bottom: 6px; font-weight: 600;">Or copy this link into your browser:</span>
                  <a href="${resetLink}" style="word-break: break-all; color: #BF3FFF; font-size: 13px; text-decoration: none; font-weight: 500;">${resetLink}</a>
                </div>
                <div style="border-top: 1px solid #E2E8F0; margin-top: 32px; padding-top: 24px;">
                  <p style="color: #94A3B8; font-size: 12px; line-height: 1.5; text-align: center; margin: 0;">This link will expire in 24 hours for security purposes.<br>If you did not submit this request, please ignore this email.</p>
                </div>
              </div>
            </div>
          </div>
        `;
        try {
          await this.emailService.sendEmail(
            email,
            'Reset your J-Ledger Admin Password',
            html,
          );
          this.logger.log(
            `Successfully sent ADMIN_PASSWORD_RESET email to ${email}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to send ADMIN_PASSWORD_RESET email: ${error.message}`,
          );
        }
        return;
      }
    }

    await this.notificationService.handleEvent(topic, payload);
  }
}

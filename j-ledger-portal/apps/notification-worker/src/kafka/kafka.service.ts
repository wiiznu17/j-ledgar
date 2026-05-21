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
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600;">J-Ledger Admin Portal 🏦</h1>
            </div>
            <div style="padding: 24px; color: #333;">
              <h2 style="margin-top: 0; color: #1e3c72;">ยินดีต้อนรับสู่ J-Ledger Admin!</h2>
              <p>คุณได้รับเชิญให้เข้าร่วมทีมผู้ดูแลระบบของ J-Ledger</p>
              <p>โปรดคลิกปุ่มด้านล่างเพื่อเปิดบัญชีและตั้งค่ารหัสผ่านของคุณ:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${setupLink}" style="background-color: #2a5298; color: white; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: bold; display: inline-block;">ตั้งค่าบัญชีของคุณ</a>
              </div>
              <p style="color: #666; font-size: 14px;">หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์ของคุณ:</p>
              <p style="word-break: break-all; color: #2a5298; font-size: 14px;"><a href="${setupLink}">${setupLink}</a></p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">ลิงก์นี้จะมีอายุการใช้งาน 24 ชั่วโมง หากคุณไม่ได้ขอรับคำเชิญนี้ โปรดเพิกเฉยต่ออีเมลนี้</p>
            </div>
          </div>
        `;
        try {
          await this.emailService.sendEmail(email, 'Welcome to J-Ledger Admin Portal! 🏦', html);
          this.logger.log(`Successfully sent ADMIN_INVITE email to ${email}`);
        } catch (error) {
          this.logger.error(`Failed to send ADMIN_INVITE email: ${error.message}`);
        }
        return;
      }

      if (eventType === 'ADMIN_PASSWORD_RESET') {
        const { email, resetLink } = metadata;
        this.logger.log(`Processing ADMIN_PASSWORD_RESET for ${email}`);
        const html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600;">J-Ledger Admin Portal 🏦</h1>
            </div>
            <div style="padding: 24px; color: #333;">
              <h2 style="margin-top: 0; color: #1e3c72;">คำขอรีเซ็ตรหัสผ่าน</h2>
              <p>เราได้รับคำขอให้รีเซ็ตรหัสผ่านผู้ดูแลระบบของคุณ</p>
              <p>โปรดคลิกปุ่มด้านล่างเพื่อเลือกและกำหนดรหัสผ่านใหม่:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #2a5298; color: white; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: bold; display: inline-block;">รีเซ็ตรหัสผ่านใหม่</a>
              </div>
              <p style="color: #666; font-size: 14px;">หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์ของคุณ:</p>
              <p style="word-break: break-all; color: #2a5298; font-size: 14px;"><a href="${resetLink}">${resetLink}</a></p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">หากคุณไม่ได้ส่งคำขอนี้ โปรดเพิกเฉยต่ออีเมลนี้และตรวจสอบให้แน่ใจว่าบัญชีของคุณปลอดภัย</p>
            </div>
          </div>
        `;
        try {
          await this.emailService.sendEmail(email, 'Reset your J-Ledger Admin Password 🔑', html);
          this.logger.log(`Successfully sent ADMIN_PASSWORD_RESET email to ${email}`);
        } catch (error) {
          this.logger.error(`Failed to send ADMIN_PASSWORD_RESET email: ${error.message}`);
        }
        return;
      }
    }

    await this.notificationService.handleEvent(topic, payload);
  }
}

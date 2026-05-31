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

      if (eventType === 'EMAIL_VERIFICATION_OTP') {
        const { email, otp } = metadata;
        this.logger.log(`Processing EMAIL_VERIFICATION_OTP for ${email}`);
        const html = `
          <div style="background-color: #F5F7FB; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <div style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);">
              <div style="background-color: #BF3FFF; height: 6px;"></div>
              <div style="padding: 40px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <span style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #2D3748;">P-WALLET</span>
                  <span style="font-size: 10px; font-weight: 700; color: #64748B; display: block; margin-top: 4px; letter-spacing: 1px;">EMAIL VERIFICATION</span>
                </div>
                <h2 style="font-size: 20px; font-weight: 700; color: #2D3748; margin-top: 0; margin-bottom: 12px; text-align: center;">รหัสยืนยันอีเมล (OTP)</h2>
                <p style="font-size: 15px; color: #4A5568; line-height: 1.6; margin-bottom: 24px; text-align: center;">รหัส OTP สำหรับยืนยันที่อยู่อีเมลของคุณคือ</p>
                <div style="text-align: center; margin: 32px 0;">
                  <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #BF3FFF; background-color: #F5F3FF; padding: 12px 32px; border-radius: 12px; display: inline-block;">${otp}</span>
                </div>
                <p style="font-size: 13px; color: #718096; line-height: 1.6; text-align: center; margin-bottom: 24px;">รหัสนี้มีอายุการใช้งาน 5 นาที หากคุณไม่ได้ส่งคำขอนี้ โปรดเพิกเฉยต่ออีเมลฉบับนี้</p>
                <div style="border-top: 1px solid #E2E8F0; margin-top: 32px; padding-top: 24px;">
                  <p style="color: #94A3B8; font-size: 12px; line-height: 1.5; text-align: center; margin: 0;">นี่เป็นอีเมลอัตโนมัติจากระบบ P-Wallet กรุณาอย่าตอบกลับ</p>
                </div>
              </div>
            </div>
          </div>
        `;
        try {
          await this.emailService.sendEmail(
            email,
            'P-Wallet: ยืนยันที่อยู่อีเมลของคุณ',
            html,
          );
          this.logger.log(`Successfully sent EMAIL_VERIFICATION_OTP email to ${email}`);
        } catch (error) {
          this.logger.error(
            `Failed to send EMAIL_VERIFICATION_OTP email: ${error.message}`,
          );
        }
        return;
      }

      if (eventType === 'PIN_RESET_OTP') {
        const { email, otp } = metadata;
        this.logger.log(`Processing PIN_RESET_OTP for ${email}`);
        const html = `
          <div style="background-color: #F5F7FB; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <div style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);">
              <div style="background-color: #BF3FFF; height: 6px;"></div>
              <div style="padding: 40px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <span style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #2D3748;">P-WALLET</span>
                  <span style="font-size: 10px; font-weight: 700; color: #64748B; display: block; margin-top: 4px; letter-spacing: 1px;">PIN RESET OTP</span>
                </div>
                <h2 style="font-size: 20px; font-weight: 700; color: #2D3748; margin-top: 0; margin-bottom: 12px; text-align: center;">รหัสรีเซ็ต PIN (OTP)</h2>
                <p style="font-size: 15px; color: #4A5568; line-height: 1.6; margin-bottom: 24px; text-align: center;">รหัส OTP สำหรับรีเซ็ตรหัส PIN ของคุณคือ</p>
                <div style="text-align: center; margin: 32px 0;">
                  <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #BF3FFF; background-color: #F5F3FF; padding: 12px 32px; border-radius: 12px; display: inline-block;">${otp}</span>
                </div>
                <p style="font-size: 13px; color: #718096; line-height: 1.6; text-align: center; margin-bottom: 24px;">รหัสนี้มีอายุการใช้งาน 5 นาที หากคุณไม่ได้ส่งคำขอนี้ โปรดระมัดระวังความปลอดภัยของบัญชีท่าน</p>
                <div style="border-top: 1px solid #E2E8F0; margin-top: 32px; padding-top: 24px;">
                  <p style="color: #94A3B8; font-size: 12px; line-height: 1.5; text-align: center; margin: 0;">นี่เป็นอีเมลอัตโนมัติจากระบบ P-Wallet กรุณาอย่าตอบกลับ</p>
                </div>
              </div>
            </div>
          </div>
        `;
        try {
          await this.emailService.sendEmail(
            email,
            'P-Wallet: รหัสรีเซ็ต PIN ของคุณ',
            html,
          );
          this.logger.log(`Successfully sent PIN_RESET_OTP email to ${email}`);
        } catch (error) {
          this.logger.error(
            `Failed to send PIN_RESET_OTP email: ${error.message}`,
          );
        }
        return;
      }

      if (eventType === 'STATEMENT_EXPORT_READY') {
        const { email, year, month, statementText } = metadata;
        this.logger.log(`Processing STATEMENT_EXPORT_READY for ${email}`);
        
        const htmlContent = statementText.split('\n').join('<br>');

        const html = `
          <div style="background-color: #F5F7FB; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <div style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);">
              <div style="background-color: #BF3FFF; height: 6px;"></div>
              <div style="padding: 40px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <span style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #2D3748;">P-WALLET</span>
                  <span style="font-size: 10px; font-weight: 700; color: #64748B; display: block; margin-top: 4px; letter-spacing: 1px;">ACCOUNT STATEMENT</span>
                </div>
                <h2 style="font-size: 20px; font-weight: 700; color: #2D3748; margin-top: 0; margin-bottom: 12px; text-align: center;">รายการเดินบัญชี (Statement)</h2>
                <p style="font-size: 15px; color: #4A5568; line-height: 1.6; margin-bottom: 24px; text-align: center;">รายการเดินบัญชีประจำเดือน ${month}/${year} ได้รับการอนุมัติและตรวจสอบจากผู้ดูแลระบบเรียบร้อยแล้ว โดยมีรายละเอียดดังต่อไปนี้</p>
                
                <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; font-family: monospace; font-size: 13px; color: #334155; line-height: 1.6; margin: 24px 0;">
                  ${htmlContent}
                </div>

                <p style="font-size: 13px; color: #718096; line-height: 1.6; text-align: center; margin-bottom: 24px;">เราได้แนบไฟล์เอกสารรายการเดินบัญชีอิเล็กทรอนิกส์ (PDF) มากับอีเมลฉบับนี้ด้วยเพื่อใช้อ้างอิงการทำธุรกรรม</p>
                <div style="border-top: 1px solid #E2E8F0; margin-top: 32px; padding-top: 24px;">
                  <p style="color: #94A3B8; font-size: 12px; line-height: 1.5; text-align: center; margin: 0;">นี่เป็นอีเมลอัตโนมัติจากระบบ P-Wallet กรุณาอย่าตอบกลับ</p>
                </div>
              </div>
            </div>
          </div>
        `;

        // Generate PDF attachment dynamically!
        const pdfBuffer = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.27 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 500 >>
stream
BT
/F1 12 Tf
70 750 Td
(P-WALLET ACCOUNT STATEMENT) Tj
0 -30 Td
(Statement Period: ${month}/${year}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000240 00000 n 
0000000350 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
438
%%EOF`);

        try {
          await this.emailService.sendEmail(
            email,
            `P-Wallet: รายการเดินบัญชีประจำเดือน ${month}/${year}`,
            html,
            [
              {
                filename: `statement_${month}_${year}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
              },
            ]
          );
          this.logger.log(`Successfully sent STATEMENT_EXPORT_READY email with PDF attachment to ${email}`);
        } catch (error) {
          this.logger.error(
            `Failed to send STATEMENT_EXPORT_READY email: ${error.message}`,
          );
        }
        return;
      }
    }

    await this.notificationService.handleEvent(topic, payload);
  }
}

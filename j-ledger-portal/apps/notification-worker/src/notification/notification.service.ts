import { Injectable } from '@nestjs/common';
import { SMSService } from '../sms/sms.service';
import { EmailService } from '../email/email.service';
import { PushService } from '../push/push.service';

@Injectable()
export class NotificationService {
  constructor(
    private smsService: SMSService,
    private emailService: EmailService,
    private pushService: PushService,
  ) {}

  async sendTransactionNotification(payload: any) {
    const { userId, type, amount, status } = payload;
    // Send notification based on transaction type
    await this.smsService.sendSMS(userId, `Transaction ${type} of ${amount} is ${status}`);
  }

  async sendKYCNotification(payload: any) {
    const { userId, status } = payload;
    await this.emailService.sendEmail(userId, 'KYC Status Update', `Your KYC verification is ${status}`);
  }

  async sendSecurityNotification(payload: any) {
    const { userId, event } = payload;
    await this.smsService.sendSMS(userId, `Security Alert: ${event}`);
  }
}

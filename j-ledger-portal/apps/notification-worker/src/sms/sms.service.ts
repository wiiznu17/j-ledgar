import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class SMSService {
  private client: any;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    this.client = twilio(accountSid, authToken);
  }

  async sendSMS(userId: string, message: string) {
    const phoneNumber = await this.getUserPhoneNumber(userId);
    const fromNumber = this.configService.get('TWILIO_PHONE_NUMBER');
    
    await this.client.messages.create({
      body: message,
      from: fromNumber,
      to: phoneNumber,
    });
  }

  private async getUserPhoneNumber(userId: string): Promise<string> {
    // TODO: Query user service or database for phone number
    return '+1234567890';
  }
}

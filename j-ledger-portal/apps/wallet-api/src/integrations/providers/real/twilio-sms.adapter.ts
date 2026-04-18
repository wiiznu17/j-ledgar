import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISmsProvider } from '../../interfaces/sms-provider.interface';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioSmsAdapter implements ISmsProvider {
  private readonly logger = new Logger(TwilioSmsAdapter.name);
  private readonly client: Twilio;
  private readonly fromNumber: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.configService.get<string>('TWILIO_SENDER_ID');

    if (!accountSid || !authToken || !from) {
      throw new Error('Twilio Credentials missing for TwilioSmsAdapter');
    }

    this.client = new Twilio(accountSid, authToken);
    this.fromNumber = from;
  }

  async sendMessage(phoneNumber: string, message: string): Promise<void> {
    this.logger.log(`Sending real SMS via Twilio to ${phoneNumber}...`);

    try {
      await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber,
      });
      this.logger.log(`SMS successfully queued via Twilio.`);
    } catch (error: any) {
      this.logger.error(`Twilio Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to deliver SMS via provider');
    }
  }
}

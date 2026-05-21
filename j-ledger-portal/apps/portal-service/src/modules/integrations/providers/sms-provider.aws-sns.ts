import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import {
  ISmsProvider,
  ISmsProvider as ISmsProviderSymbol,
} from '../interfaces/sms-provider.interface';

@Injectable()
export class AwsSnsSmSProvider implements ISmsProvider {
  private readonly client: SNSClient;
  private readonly logger = new Logger(AwsSnsSmSProvider.name);
  private readonly senderId: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new SNSClient({
      region: this.configService.get<string>('AWS_REGION', 'ap-southeast-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });

    // Sender ID (ตัวอักษร A-Z ได้ 11 ตัว) - ถ้าไม่ตั้งจะใช้ default ของ AWS
    this.senderId =
      this.configService.get<string>('AWS_SNS_SENDER_ID') || 'JLedger';
  }

  async sendMessage(phoneNumber: string, message: string): Promise<void> {
    // Normalize phone number to E.164 format (+66XXXXXXXXX)
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    try {
      const command = new PublishCommand({
        Message: message,
        PhoneNumber: normalizedPhone,
        MessageAttributes: {
          // SMS Type: Transactional = higher priority, better delivery for OTP
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional',
          },
          // Sender ID (not guaranteed to work on all carriers in TH)
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: this.senderId,
          },
        },
      });

      const response = await this.client.send(command);
      this.logger.log(
        `SMS sent to ${normalizedPhone}, MessageId: ${response.MessageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send SMS to ${normalizedPhone}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Normalize Thai phone numbers to E.164 format (+66XXXXXXXXX)
   * Handles: 08X-XXX-XXXX, 08XXXXXXXX, +668XXXXXXXX, 668XXXXXXXX
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove all spaces, dashes, parentheses
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // Already in E.164 format
    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    // Starts with 66 (without +)
    if (cleaned.startsWith('66')) {
      return `+${cleaned}`;
    }

    // Thai local number starting with 0 (e.g. 0812345678)
    if (cleaned.startsWith('0')) {
      return `+66${cleaned.slice(1)}`;
    }

    // Fallback: assume already a valid number without prefix
    return `+66${cleaned}`;
  }
}

export const AwsSnsSmSProviderProvider = {
  provide: ISmsProviderSymbol,
  useClass: AwsSnsSmSProvider,
};

import { Injectable } from '@nestjs/common';
import { ISmsProvider, ISmsProvider as ISmsProviderSymbol } from '../interfaces/sms-provider.interface';

@Injectable()
export class SmsProviderMock implements ISmsProvider {
  async sendMessage(phoneNumber: string, message: string): Promise<void> {
    console.log(`[SMS Mock] To: ${phoneNumber}, Message: ${message}`);
  }
}

export const SmsProviderMockProvider = {
  provide: ISmsProviderSymbol,
  useClass: SmsProviderMock,
};

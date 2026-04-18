import { Injectable, Logger } from '@nestjs/common';
import { ISmsProvider } from '../interfaces/sms-provider.interface';

@Injectable()
export class MockSmsAdapter implements ISmsProvider {
  private readonly logger = new Logger(MockSmsAdapter.name);

  async sendMessage(phoneNumber: string, message: string): Promise<void> {
    this.logger.log(`[MOCK SMS] Sending to ${phoneNumber}: ${message}`);
    // Simulate latency
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

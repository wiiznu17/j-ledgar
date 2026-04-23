import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OtpService } from './otp.service';
import { SmsProviderMockProvider } from '../integrations/providers/sms-provider.mock';

@Module({
  imports: [PrismaModule],
  providers: [OtpService, SmsProviderMockProvider],
  exports: [OtpService],
})
export class OtpModule {}

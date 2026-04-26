import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SMSModule } from '../sms/sms.module';
import { EmailModule } from '../email/email.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [SMSModule, EmailModule, PushModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}

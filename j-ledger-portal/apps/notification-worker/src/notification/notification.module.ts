import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EmailModule } from '../email/email.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [EmailModule, PushModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}

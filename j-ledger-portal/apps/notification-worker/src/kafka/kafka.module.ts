import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { NotificationModule } from '../notification/notification.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [NotificationModule, EmailModule],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}

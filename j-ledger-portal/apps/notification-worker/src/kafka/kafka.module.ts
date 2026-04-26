import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}

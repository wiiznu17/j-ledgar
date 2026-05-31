import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { KafkaProducerService } from './kafka-producer.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [NotificationService, KafkaProducerService],
  exports: [NotificationService, KafkaProducerService],
})
export class NotificationModule {}

import { Module } from '@nestjs/common';
import { NotificationController } from '../../user/notification/notification.controller';
import { NotificationService } from './notification.service';
import { KafkaProducerService } from './kafka-producer.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController],
  providers: [NotificationService, KafkaProducerService],
  exports: [NotificationService, KafkaProducerService],
})
export class NotificationModule {}

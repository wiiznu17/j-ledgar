import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationProxyModule } from '../notification-proxy/notification-proxy.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [NotificationProxyModule, UserModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}

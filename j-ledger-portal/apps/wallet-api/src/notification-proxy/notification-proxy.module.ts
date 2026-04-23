import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { NotificationProxyService } from './notification-proxy.service';

@Global()
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [NotificationProxyService],
  exports: [NotificationProxyService],
})
export class NotificationProxyModule {}

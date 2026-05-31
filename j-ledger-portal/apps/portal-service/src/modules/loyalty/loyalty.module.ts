import { Module, Global } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyExpiryService } from './loyalty-expiry.service';
import { NotificationModule } from '../notification/notification.module';

@Global()
@Module({
  imports: [NotificationModule],
  providers: [LoyaltyService, LoyaltyExpiryService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}

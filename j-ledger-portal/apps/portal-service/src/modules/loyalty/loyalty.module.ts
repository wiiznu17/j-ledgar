import { Module, Global } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from '../../user/loyalty/loyalty.controller';

@Global()
@Module({
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}

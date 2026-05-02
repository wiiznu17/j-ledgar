import { Module } from '@nestjs/common';
import { DealService } from './deal.service';
import { DealController } from './deal.controller';
import { AdminDealController } from './admin-deal.controller';

@Module({
  controllers: [DealController, AdminDealController],
  providers: [DealService],
  exports: [DealService],
})
export class DealModule {}

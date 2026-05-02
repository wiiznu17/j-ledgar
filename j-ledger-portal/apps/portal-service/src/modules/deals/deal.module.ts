import { Module } from '@nestjs/common';
import { DealService } from './deal.service';
import { DealController } from '../../user/deals/deal.controller';

@Module({
  controllers: [DealController],
  providers: [DealService],
  exports: [DealService],
})
export class DealModule {}

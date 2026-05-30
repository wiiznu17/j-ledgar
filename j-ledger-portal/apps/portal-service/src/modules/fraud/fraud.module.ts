import { Module } from '@nestjs/common';
import { FraudService } from './fraud.service';
import { AdminFraudController } from '../../admin/fraud/admin-fraud.controller';

@Module({
  providers: [FraudService],
  controllers: [AdminFraudController],
  exports: [FraudService],
})
export class FraudModule {}

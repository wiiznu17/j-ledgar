import { Module } from '@nestjs/common';
import { PIIService } from './pii.service';
import { PIIController } from './pii.controller';

@Module({
  controllers: [PIIController],
  providers: [PIIService],
  exports: [PIIService],
})
export class PIIModule {}

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FinanceService } from './finance.service';
import { IntegrationService } from './integration.service';
import { IntegrationController } from './integration.controller';

@Module({
  imports: [HttpModule],
  providers: [FinanceService, IntegrationService],
  controllers: [IntegrationController],
  exports: [FinanceService, IntegrationService],
})
export class IntegrationModule {}

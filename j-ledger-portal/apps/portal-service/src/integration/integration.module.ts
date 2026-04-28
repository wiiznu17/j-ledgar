import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FinanceService } from './finance.service';
import { IntegrationService } from './integration.service';
import { IntegrationController } from './integration.controller';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [HttpModule],
  providers: [FinanceService, IntegrationService],
  controllers: [IntegrationController, StripeWebhookController],
  exports: [FinanceService, IntegrationService],
})
export class IntegrationModule {}

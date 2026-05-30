import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FinanceService } from './finance.service';
import { IntegrationService } from './integration.service';
import { IntegrationController } from '../../user/integration/integration.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { BillingModule } from '../billing/billing.module';
import { BannerModule } from '../banners/banner.module';
import { FraudModule } from '../fraud/fraud.module';

@Module({
  imports: [
    HttpModule,
    forwardRef(() => BillingModule),
    BannerModule,
    FraudModule,
  ],
  providers: [FinanceService, IntegrationService],
  controllers: [IntegrationController, StripeWebhookController],
  exports: [FinanceService, IntegrationService],
})
export class IntegrationModule {}

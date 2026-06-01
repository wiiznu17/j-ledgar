import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IntegrationService } from './integration.service';
import { IntegrationWebhookController } from './integration-webhook.controller';
import { BillingModule } from '../billing/billing.module';
import { BannerModule } from '../banners/banner.module';
import { FraudModule } from '../fraud/fraud.module';
import { StripeIntegrationService } from './services/stripe-integration.service';
import { P2PTransferService } from './services/p2p-transfer.service';
import { TransactionHistoryService } from './services/transaction-history.service';
import { DashboardBffService } from './services/dashboard-bff.service';
import { BankIntegrationService } from './services/bank-integration.service';
import { WebhookConfigService } from './services/webhook-config.service';
import { StatementExportService } from './services/statement-export.service';

@Module({
  imports: [
    HttpModule,
    forwardRef(() => BillingModule),
    BannerModule,
    FraudModule,
  ],
  providers: [
    IntegrationService,
    StripeIntegrationService,
    P2PTransferService,
    TransactionHistoryService,
    DashboardBffService,
    BankIntegrationService,
    WebhookConfigService,
    StatementExportService,
  ],
  controllers: [IntegrationWebhookController],
  exports: [
    IntegrationService,
    StripeIntegrationService,
    P2PTransferService,
    TransactionHistoryService,
    DashboardBffService,
    BankIntegrationService,
    WebhookConfigService,
    StatementExportService,
  ],
})
export class IntegrationModule {}

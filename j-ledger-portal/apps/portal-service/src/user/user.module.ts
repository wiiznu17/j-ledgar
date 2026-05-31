import { Module } from '@nestjs/common';

// Controllers
import { IdentityController } from './identity/identity.controller';
import { ScheduledTransferController } from './integration/scheduled-transfer.controller';
import { BannerController } from './banners/banner.controller';
import { BillingController } from './billing/billing.controller';
import { DealController } from './deals/deal.controller';
import { IntegrationController } from './integration/integration.controller';
import { KycController } from './kyc/kyc.controller';
import { LoyaltyController } from './loyalty/loyalty.controller';
import { MerchantController } from './merchant/merchant.controller';
import { NotificationController } from './notification/notification.controller';
import { ReportingController } from './reporting/reporting.controller';

// Domain Modules (required for dependency injection in controllers)
import { IdentityModule } from '../modules/identity/identity.module';
import { ScheduledTransferModule } from '../modules/scheduled-transfer/scheduled-transfer.module';
import { BannerModule } from '../modules/banners/banner.module';
import { BillingModule } from '../modules/billing/billing.module';
import { DealModule } from '../modules/deals/deal.module';
import { IntegrationModule } from '../modules/integration/integration.module';
import { KycModule } from '../modules/kyc/kyc.module';
import { LoyaltyModule } from '../modules/loyalty/loyalty.module';
import { MerchantModule } from '../modules/merchant/merchant.module';
import { NotificationModule } from '../modules/notification/notification.module';
import { ReportingModule } from '../modules/reporting/reporting.module';
import { StorageModule } from '../core/storage/storage.module';

@Module({
  imports: [
    IdentityModule,
    ScheduledTransferModule,
    BannerModule,
    BillingModule,
    DealModule,
    IntegrationModule,
    KycModule,
    LoyaltyModule,
    MerchantModule,
    NotificationModule,
    ReportingModule,
    StorageModule,
  ],
  controllers: [
    IdentityController,
    ScheduledTransferController,
    BannerController,
    BillingController,
    DealController,
    IntegrationController,
    KycController,
    LoyaltyController,
    MerchantController,
    NotificationController,
    ReportingController,
  ],
  providers: [],
})
export class UserModule {}

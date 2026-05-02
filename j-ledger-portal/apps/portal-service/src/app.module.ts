import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { IdentityModule } from './identity/identity.module';
import { KycModule } from './kyc/kyc.module';
import { AdminModule } from './admin/admin.module';
import { IntegrationModule } from './integration/integration.module';
import { AuditModule } from './audit/audit.module';
import { ReportingModule } from './reporting/reporting.module';
import { NotificationModule } from './notification/notification.module';
import { BillingModule } from './billing/billing.module';
import { StorageModule } from './storage/storage.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { DealModule } from './deals/deal.module';
import { BannerModule } from './banners/banner.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    IdentityModule,
    KycModule,
    AdminModule,
    IntegrationModule,
    AuditModule,
    ReportingModule,
    NotificationModule,
    BillingModule,
    StorageModule,
    LoyaltyModule,
    DealModule,
    BannerModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

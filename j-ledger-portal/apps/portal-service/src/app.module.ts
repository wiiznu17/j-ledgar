import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './core/prisma/prisma.module';
import { RedisModule } from './core/redis/redis.module';
import { IdentityModule } from './modules/identity/identity.module';
import { KycModule } from './modules/kyc/kyc.module';
import { AdminModule } from './admin/admin.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { AuditModule } from './modules/audit/audit.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { NotificationModule } from './modules/notification/notification.module';
import { BillingModule } from './modules/billing/billing.module';
import { StorageModule } from './core/storage/storage.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { DealModule } from './modules/deals/deal.module';
import { BannerModule } from './modules/banners/banner.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { HealthController } from './core/health/health.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerStorageRedisService } from './core/redis/throttler-storage-redis.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ThrottlerStorageRedisService],
      useFactory: (storage: ThrottlerStorageRedisService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60000,
            limit: 60,
          },
          {
            name: 'otp-send',
            ttl: 60000,
            limit: 3,
          },
          {
            name: 'otp-verify',
            ttl: 300000,
            limit: 3,
          },
          {
            name: 'login',
            ttl: 900000,
            limit: 3,
          },
          {
            name: 'refreshToken',
            ttl: 60000,
            limit: 10,
          },
          {
            name: 'pinVerify',
            ttl: 300000,
            limit: 5,
          },
          {
            name: 'biometricVerify',
            ttl: 60000,
            limit: 10,
          },
          {
            name: 'accountDeletion',
            ttl: 3600000,
            limit: 2,
          },
        ],
        storage,
      }),
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
    MerchantModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}


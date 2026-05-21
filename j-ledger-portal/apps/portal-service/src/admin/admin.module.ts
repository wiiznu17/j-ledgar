import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AdminService } from './services/admin.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { MailService } from './services/mail.service';
import { AdminStaffController } from './staff/admin-staff.controller';
import { AdminCommonController } from './common/admin-common.controller';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminSystemController } from './system/admin-system.controller';
import { AdminReconciliationController } from './reconciliation/admin-reconciliation.controller';
import { AdminFinanceController } from './finance/admin-finance.controller';
import { AdminUserController } from './users/admin-user.controller';
import { AdminBannerController } from './banners/admin-banner.controller';
import { AdminDealController } from './deals/admin-deal.controller';
import { AdminAuditController } from './audit/admin-audit.controller';
import { AdminIntegrationController } from './integration/admin-integration.controller';
import { AdminKycController } from './kyc/admin-kyc.controller';
import { AdminDashboardController } from './dashboard/admin-dashboard.controller';
import { AdminLoyaltyController } from './loyalty/admin-loyalty.controller';
import { IdentityModule } from '../modules/identity/identity.module';
import { StorageModule } from '../core/storage/storage.module';
import { ReportingModule } from '../modules/reporting/reporting.module';
import { IntegrationModule } from '../modules/integration/integration.module';
import { BannerModule } from '../modules/banners/banner.module';
import { DealModule } from '../modules/deals/deal.module';
import { LoyaltyModule } from '../modules/loyalty/loyalty.module';
import { AuditModule } from '../modules/audit/audit.module';
import { KycModule } from '../modules/kyc/kyc.module';
import { NotificationModule } from '../modules/notification/notification.module';
import { JwtModule } from '@nestjs/jwt';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';

@Module({
  imports: [
    IdentityModule,
    StorageModule,
    ReportingModule,
    IntegrationModule,
    BannerModule,
    DealModule,
    LoyaltyModule,
    AuditModule,
    KycModule,
    NotificationModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.ADMIN_JWT_SECRET;
        if (!secret || secret.length < 32) {
          throw new Error('ADMIN_JWT_SECRET is missing or too short');
        }
        return {
          secret: secret,
          signOptions: { expiresIn: '12h' },
        };
      },
    }),
  ],
  controllers: [
    AdminStaffController,
    AdminCommonController,
    AdminAuthController,
    AdminSystemController,
    AdminReconciliationController,
    AdminFinanceController,
    AdminUserController,
    AdminBannerController,
    AdminDealController,
    AdminAuditController,
    AdminIntegrationController,
    AdminKycController,
    AdminDashboardController,
    AdminLoyaltyController,
  ],
  providers: [
    AdminService,
    AdminJwtStrategy,
    MailService,
    {
      provide: 'APP_INTERCEPTOR',
      useClass: AuditInterceptor,
    },
  ],
  exports: [AdminService],
})
export class AdminModule {}

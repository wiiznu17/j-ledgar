import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AdminService } from '../modules/admin/admin.service';
import { AdminFraudService } from '../modules/admin/admin-fraud.service';
import { AdminApprovalService } from '../modules/admin/admin-approval.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { MailService } from '../modules/admin/mail.service';
import { AdminStaffController } from './staff/admin-staff.controller';
import { AdminCommonController } from './common/admin-common.controller';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminSystemController } from './system/admin-system.controller';
import { AdminReconciliationController } from './reconciliation/admin-reconciliation.controller';
import { AdminFinanceController } from './finance/admin-finance.controller';
import { AdminUserController } from './users/admin-user.controller';
import { AdminMerchantController } from './merchant/admin-merchant.controller';
import { AdminBannerController } from './banners/admin-banner.controller';
import { AdminDealController } from './deals/admin-deal.controller';
import { AdminAuditController } from './audit/admin-audit.controller';
import { AdminIntegrationController } from './integration/admin-integration.controller';
import { AdminKycController } from './kyc/admin-kyc.controller';
import { AdminDashboardController } from './dashboard/admin-dashboard.controller';
import { AdminLoyaltyController } from './loyalty/admin-loyalty.controller';
import { AdminReportsController } from './reports/admin-reports.controller';
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
import { MerchantModule } from 'src/modules/merchant/merchant.module';

@Module({
  imports: [
    MerchantModule,
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
          signOptions: { expiresIn: '15m' },
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
    AdminMerchantController,
    AdminBannerController,
    AdminDealController,
    AdminAuditController,
    AdminIntegrationController,
    AdminKycController,
    AdminDashboardController,
    AdminLoyaltyController,
    AdminReportsController,
  ],
  providers: [
    AdminService,
    AdminFraudService,
    AdminApprovalService,
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

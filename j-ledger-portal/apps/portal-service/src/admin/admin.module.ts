import { Module } from '@nestjs/common';
import { AdminService } from './services/admin.service';
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
import { IdentityModule } from '../modules/identity/identity.module';
import { StorageModule } from '../core/storage/storage.module';
import { ReportingModule } from '../modules/reporting/reporting.module';
import { IntegrationModule } from '../modules/integration/integration.module';
import { BannerModule } from '../modules/banners/banner.module';
import { DealModule } from '../modules/deals/deal.module';
import { AuditModule } from '../modules/audit/audit.module';
import { KycModule } from '../modules/kyc/kyc.module';
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
    AuditModule,
    KycModule,
    JwtModule.register({
      secret: process.env.ADMIN_JWT_SECRET || 'jledger-admin-super-secret-2024-dev-key-32chars',
      signOptions: { expiresIn: '1h' },
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
  ],
  providers: [AdminService, AdminJwtStrategy, MailService],
  exports: [AdminService],
})
export class AdminModule {}

import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminCommonController } from './admin-common.controller';
import { AdminAuthController } from './admin-auth.controller';
import { AdminSystemController } from './admin-system.controller';
import { AdminReconciliationController } from './admin-reconciliation.controller';
import { AdminFinanceController } from './admin-finance.controller';
import { AdminUserController } from './admin-user.controller';
import { IdentityModule } from '../identity/identity.module';
import { StorageModule } from '../storage/storage.module';
import { ReportingModule } from '../reporting/reporting.module';
import { IntegrationModule } from '../integration/integration.module';
import { JwtModule } from '@nestjs/jwt';
import { AdminJwtStrategy } from './admin-jwt.strategy';

@Module({
  imports: [
    IdentityModule,
    StorageModule,
    ReportingModule,
    IntegrationModule,
    JwtModule.register({
      secret: process.env.ADMIN_JWT_SECRET || 'jledger-admin-super-secret-2024-dev-key-32chars',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [
    AdminController, 
    AdminCommonController, 
    AdminAuthController,
    AdminSystemController,
    AdminReconciliationController,
    AdminFinanceController,
    AdminUserController
  ],
  providers: [AdminService, AdminJwtStrategy],
  exports: [AdminService],
})
export class AdminModule {}

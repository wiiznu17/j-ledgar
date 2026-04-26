import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { AuthModule } from './auth/auth.module';
// import { KYCModule } from './kyc/kyc.module';
// import { AdminModule } from './admin/admin.module';
import { IntegrationModule } from './integration/integration.module';
import { AuditModule } from './audit/audit.module';
import { ReportingModule } from './reporting/reporting.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // AuthModule,
    // KYCModule,
    // AdminModule,
    IntegrationModule,
    AuditModule,
    ReportingModule,
  ],
})
export class AppModule {}

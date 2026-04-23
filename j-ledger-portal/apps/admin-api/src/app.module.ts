import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { LedgerProxyModule } from './ledger-proxy/ledger-proxy.module';
import { UsersModule } from './users/users.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AMLModule } from './aml/aml.module';
import { AccountsModule } from './accounts/accounts.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { AuditModule } from './audit/audit.module';
import { ProxiesModule } from './proxies/proxies.module';
import { KYCModule } from './kyc/kyc.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    LedgerProxyModule,
    ProxiesModule,
    UsersModule,
    TransactionsModule,
    AMLModule,
    AccountsModule,
    ReconciliationModule,
    AuditModule,
    KYCModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

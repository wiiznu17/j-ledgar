import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthProxyService } from './auth-proxy.service';
import { WalletProxyService } from './wallet-proxy.service';
import { TransactionProxyService } from './transaction-proxy.service';
import { KycProxyService } from './kyc-proxy.service';

@Module({
  imports: [HttpModule],
  providers: [
    AuthProxyService,
    WalletProxyService,
    TransactionProxyService,
    KycProxyService,
  ],
  exports: [
    AuthProxyService,
    WalletProxyService,
    TransactionProxyService,
    KycProxyService,
  ],
})
export class ProxyModule {}

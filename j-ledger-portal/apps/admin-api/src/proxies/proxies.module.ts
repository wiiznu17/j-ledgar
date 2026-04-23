import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminAuthProxyService } from './admin-auth-proxy.service';
import { UserKYCProxyService } from './user-kyc-proxy.service';
import { WalletProxyService } from './wallet-proxy.service';
import { AuditProxyService } from './audit-proxy.service';

@Module({
  imports: [HttpModule],
  providers: [AdminAuthProxyService, UserKYCProxyService, WalletProxyService, AuditProxyService],
  exports: [AdminAuthProxyService, UserKYCProxyService, WalletProxyService, AuditProxyService],
})
export class ProxiesModule {}

import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { IntegrationModule } from '../integration/integration.module';
import { AuditModule } from '../audit/audit.module';
import { AdminModule } from '../../admin/admin.module';
import { TerminalNonceService } from './security/terminal-nonce.service';
import { TerminalIdempotencyService } from './security/terminal-idempotency.service';

@Module({
  imports: [IntegrationModule, AuditModule, AdminModule],
  controllers: [],
  providers: [
    MerchantService,
    TerminalNonceService,
    TerminalIdempotencyService,
  ],
  exports: [MerchantService, TerminalNonceService, TerminalIdempotencyService],
})
export class MerchantModule {}

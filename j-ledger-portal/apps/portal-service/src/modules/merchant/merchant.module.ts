import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { TerminalController } from '../../terminal/terminal.controller';
import { AdminMerchantController } from '../../admin/merchant/admin-merchant.controller';
import { MerchantController } from '../../user/merchant/merchant.controller';
import { IntegrationModule } from '../integration/integration.module';
import { AuditModule } from '../audit/audit.module';
import { AdminModule } from '../../admin/admin.module';
import { TerminalNonceService } from './security/terminal-nonce.service';
import { TerminalIdempotencyService } from './security/terminal-idempotency.service';

@Module({
  imports: [IntegrationModule, AuditModule, AdminModule],
  controllers: [TerminalController, AdminMerchantController, MerchantController],
  providers: [MerchantService, TerminalNonceService, TerminalIdempotencyService],
  exports: [MerchantService, TerminalNonceService, TerminalIdempotencyService],
})
export class MerchantModule {}

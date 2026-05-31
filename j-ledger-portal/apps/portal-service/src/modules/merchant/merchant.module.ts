import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantApplicationService } from './services/merchant-application.service';
import { MerchantPartnerService } from './services/merchant-partner.service';
import { MerchantPosService } from './services/merchant-pos.service';
import { MerchantPaymentService } from './services/merchant-payment.service';
import { MerchantSettlementService } from './services/merchant-settlement.service';
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
    MerchantApplicationService,
    MerchantPartnerService,
    MerchantPosService,
    MerchantPaymentService,
    MerchantSettlementService,
    TerminalNonceService,
    TerminalIdempotencyService,
  ],
  exports: [
    MerchantService,
    MerchantApplicationService,
    MerchantPartnerService,
    MerchantPosService,
    MerchantPaymentService,
    MerchantSettlementService,
    TerminalNonceService,
    TerminalIdempotencyService,
  ],
})
export class MerchantModule {}

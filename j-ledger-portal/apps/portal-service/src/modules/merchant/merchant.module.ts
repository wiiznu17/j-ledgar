import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantApplicationService } from './services/merchant-application.service';
import { MerchantPartnerService } from './services/merchant-partner.service';
import { MerchantPosService } from './services/merchant-pos.service';
import { MerchantPaymentService } from './services/merchant-payment.service';
import { MerchantSettlementService } from './services/merchant-settlement.service';
import { IntegrationModule } from '../integration/integration.module';
import { AuditModule } from '../audit/audit.module';
// import { AdminModule } from '../../admin/admin.module';
import { TerminalNonceService } from './security/terminal-nonce.service';
import { TerminalIdempotencyService } from './security/terminal-idempotency.service';

import { MerchantQrPaymentService } from './services/payments/merchant-qr-payment.service';
import { MerchantManualPaymentService } from './services/payments/merchant-manual-payment.service';
import { MerchantTerminalPaymentService } from './services/payments/merchant-terminal-payment.service';
import { MerchantTerminalRedemptionService } from './services/payments/merchant-terminal-redemption.service';

@Module({
  imports: [IntegrationModule, AuditModule],
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
    MerchantQrPaymentService,
    MerchantManualPaymentService,
    MerchantTerminalPaymentService,
    MerchantTerminalRedemptionService,
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
    MerchantQrPaymentService,
    MerchantManualPaymentService,
    MerchantTerminalPaymentService,
    MerchantTerminalRedemptionService,
  ],
})
export class MerchantModule {}

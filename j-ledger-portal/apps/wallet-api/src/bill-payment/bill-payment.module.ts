import { Module } from '@nestjs/common';
import { BillPaymentController } from './bill-payment.controller';
import { BillPaymentService } from './bill-payment.service';
import { LedgerProxyModule } from '../ledger-proxy/ledger-proxy.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [LedgerProxyModule, UserModule],
  controllers: [BillPaymentController],
  providers: [BillPaymentService],
})
export class BillPaymentModule {}

import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { LedgerProxyModule } from '../ledger-proxy/ledger-proxy.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [LedgerProxyModule, UserModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}

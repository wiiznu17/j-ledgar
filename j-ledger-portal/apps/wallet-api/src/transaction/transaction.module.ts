import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { AuthModule } from '../auth/auth.module';
import { LedgerProxyModule } from '../ledger-proxy/ledger-proxy.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [AuthModule, UserModule, LedgerProxyModule],
  controllers: [TransactionController],
})
export class TransactionModule {}

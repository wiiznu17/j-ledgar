import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LedgerProxyService } from './ledger-proxy.service';
import { AccountController } from './account.controller';
import { TransactionController } from './transaction.controller';
import { SystemController } from './system.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  providers: [LedgerProxyService],
  controllers: [AccountController, TransactionController, SystemController],
  exports: [LedgerProxyService],
})
export class LedgerProxyModule {}

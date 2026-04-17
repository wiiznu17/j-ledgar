import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LedgerProxyService } from './ledger-proxy.service';

@Module({
  imports: [HttpModule],
  providers: [LedgerProxyService],
  exports: [LedgerProxyService],
})
export class LedgerProxyModule {}

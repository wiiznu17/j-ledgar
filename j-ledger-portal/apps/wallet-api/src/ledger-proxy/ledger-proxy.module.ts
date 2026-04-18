import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { LedgerProxyService } from './ledger-proxy.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [LedgerProxyService],
  exports: [LedgerProxyService],
})
export class LedgerProxyModule {}

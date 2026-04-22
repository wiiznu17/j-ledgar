import { Module } from '@nestjs/common';
import { AMLService } from './aml.service';
import { AMLController } from './aml.controller';
import { LedgerProxyModule } from '../ledger-proxy/ledger-proxy.module';

@Module({
  imports: [LedgerProxyModule],
  controllers: [AMLController],
  providers: [AMLService],
  exports: [AMLService],
})
export class AMLModule {}

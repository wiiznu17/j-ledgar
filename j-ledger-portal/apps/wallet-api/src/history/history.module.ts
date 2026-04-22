import { Module } from '@nestjs/common';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { LedgerProxyModule } from '../ledger-proxy/ledger-proxy.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [LedgerProxyModule, UserModule],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}

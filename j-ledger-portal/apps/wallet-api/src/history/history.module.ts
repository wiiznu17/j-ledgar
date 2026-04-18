import { Module } from '@nestjs/common';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { LedgerProxyModule } from '../ledger-proxy/ledger-proxy.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [LedgerProxyModule, PrismaModule],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}

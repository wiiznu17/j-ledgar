import { Module } from '@nestjs/common';
import { OutboxWorker } from './outbox.worker';
import { PrismaModule } from '../prisma/prisma.module';
import { LedgerProxyModule } from '../ledger-proxy/ledger-proxy.module';

@Module({
  imports: [PrismaModule, LedgerProxyModule],
  providers: [OutboxWorker],
})
export class OutboxModule {}

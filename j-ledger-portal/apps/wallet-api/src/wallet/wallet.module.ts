import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { LedgerProxyModule } from '../ledger-proxy/ledger-proxy.module';

@Module({
  imports: [LedgerProxyModule],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}

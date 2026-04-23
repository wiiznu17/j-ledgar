import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { LedgerProxyModule } from '../ledger-proxy/ledger-proxy.module';

@Module({
  imports: [LedgerProxyModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}

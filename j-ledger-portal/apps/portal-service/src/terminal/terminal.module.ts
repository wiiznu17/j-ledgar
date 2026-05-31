import { Module } from '@nestjs/common';
import { TerminalController } from './terminal.controller';
import { TerminalDealController } from './terminal-deal.controller';
import { MerchantModule } from '../modules/merchant/merchant.module';
import { AuditModule } from '../modules/audit/audit.module';

@Module({
  imports: [MerchantModule, AuditModule],
  controllers: [TerminalController, TerminalDealController],
  providers: [],
})
export class TerminalModule {}

import { Module } from '@nestjs/common';
import { ScheduledTransferService } from './scheduled-transfer.service';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [IntegrationModule],
  providers: [ScheduledTransferService],
  exports: [ScheduledTransferService],
})
export class ScheduledTransferModule {}

import { Module } from '@nestjs/common';
import { ScheduledTransferService } from './scheduled-transfer.service';
import { ScheduledTransferController } from '../../user/integration/scheduled-transfer.controller';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [IntegrationModule],
  providers: [ScheduledTransferService],
  controllers: [ScheduledTransferController],
  exports: [ScheduledTransferService],
})
export class ScheduledTransferModule {}

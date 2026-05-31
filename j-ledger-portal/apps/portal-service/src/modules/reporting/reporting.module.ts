import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReportingService } from './reporting.service';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [HttpModule, IntegrationModule],
  providers: [ReportingService],
  exports: [ReportingService],
})
export class ReportingModule {}

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [HttpModule, IntegrationModule],
  controllers: [ReportingController],
  providers: [ReportingService],
  exports: [ReportingService],
})
export class ReportingModule {}

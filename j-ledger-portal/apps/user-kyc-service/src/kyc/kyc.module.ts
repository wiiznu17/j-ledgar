import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { KYCService } from './kyc.service';
import { KYCController } from './kyc.controller';
import { KycCleanupService } from './kyc-cleanup.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  controllers: [KYCController],
  providers: [KYCService, KycCleanupService],
  exports: [KYCService],
})
export class KYCModule {}

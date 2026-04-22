import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { KycCleanupTask } from './tasks/cleanup.task';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [KycController],
  providers: [
    KycService,
    KycCleanupTask,
  ],
})
export class KycModule {}

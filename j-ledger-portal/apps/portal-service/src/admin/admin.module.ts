import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminCommonController } from './admin-common.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [AdminController, AdminCommonController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

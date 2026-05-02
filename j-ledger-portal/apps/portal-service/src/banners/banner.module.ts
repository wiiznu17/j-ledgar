import { Module } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BannerController, AdminBannerController } from './banner.controller';

@Module({
  controllers: [BannerController, AdminBannerController],
  providers: [BannerService],
  exports: [BannerService],
})
export class BannerModule {}

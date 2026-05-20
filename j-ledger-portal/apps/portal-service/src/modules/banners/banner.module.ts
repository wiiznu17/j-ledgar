import { Module } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BannerController } from '../../user/banners/banner.controller';

@Module({
  controllers: [BannerController],
  providers: [BannerService],
  exports: [BannerService],
})
export class BannerModule {}

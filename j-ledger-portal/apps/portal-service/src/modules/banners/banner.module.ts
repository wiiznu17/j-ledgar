import { Module } from '@nestjs/common';
import { BannerService } from './banner.service';

@Module({
  providers: [BannerService],
  exports: [BannerService],
})
export class BannerModule {}

import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BannerService } from './banner.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  async getActiveBanners() {
    return this.bannerService.getActiveBanners();
  }
}

@Controller('admin/banners')
@UseGuards(JwtAuthGuard)
export class AdminBannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  async getAllBanners() {
    return this.bannerService.getAllBanners();
  }

  @Post()
  async createBanner(@Body() data: any) {
    return this.bannerService.createBanner(data);
  }

  @Put(':id')
  async updateBanner(@Param('id') id: string, @Body() data: any) {
    return this.bannerService.updateBanner(id, data);
  }

  @Delete(':id')
  async deleteBanner(@Param('id') id: string) {
    return this.bannerService.deleteBanner(id);
  }
}

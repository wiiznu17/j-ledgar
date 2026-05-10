import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BannerService } from '../../modules/banners/banner.service';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';

@Controller('admin/banners')
@UseGuards(AdminJwtGuard)
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

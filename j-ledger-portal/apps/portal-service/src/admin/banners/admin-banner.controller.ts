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
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminPermissionsGuard } from '../guards/admin-permissions.guard';
import { Permission } from '@repo/dto';
import { Permissions as RequirePermissions } from '../decorators/permissions.decorator';
import { AuditLog } from '../decorators/audit.decorator';
import { ResourceType } from '../../modules/audit/audit.service';

@Controller('admin/banners')
@UseGuards(AdminJwtGuard, AdminRolesGuard, AdminPermissionsGuard)
export class AdminBannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  @RequirePermissions(Permission.VIEW_BANNERS)
  async getAllBanners() {
    return this.bannerService.getAllBanners();
  }

  @Post()
  @RequirePermissions(Permission.MANAGE_BANNERS)
  @AuditLog(null as any, ResourceType.BANNER, 'Created promotional banner')
  async createBanner(@Body() data: any) {
    return this.bannerService.createBanner(data);
  }

  @Put(':id')
  @RequirePermissions(Permission.MANAGE_BANNERS)
  @AuditLog(null as any, ResourceType.BANNER, 'Updated promotional banner')
  async updateBanner(@Param('id') id: string, @Body() data: any) {
    return this.bannerService.updateBanner(id, data);
  }

  @Delete(':id')
  @RequirePermissions(Permission.MANAGE_BANNERS)
  @AuditLog(null as any, ResourceType.BANNER, 'Deleted promotional banner')
  async deleteBanner(@Param('id') id: string) {
    return this.bannerService.deleteBanner(id);
  }
}

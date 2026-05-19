import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DealService } from '../../modules/deals/deal.service';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminPermissionsGuard } from '../guards/admin-permissions.guard';
import { Permission } from '@repo/dto';
import { Permissions as RequirePermissions } from '../decorators/permissions.decorator';
import { AuditLog } from '../decorators/audit.decorator';
import { ResourceType } from '../../modules/audit/audit.service';
import {
  CreateBrandDto,
  UpdateBrandDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateDealDto,
  UpdateDealDto,
} from '../../modules/deals/dto/deal-admin.dto';

@Controller('admin/deals')
@UseGuards(AdminJwtGuard, AdminRolesGuard, AdminPermissionsGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class AdminDealController {
  constructor(private readonly dealService: DealService) {}

  @Get()
  @RequirePermissions(Permission.VIEW_DEALS)
  async getAllDeals(
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dealService.getDealsAdmin({
      categoryId,
      brandId,
      search,
      isActive:
        isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Get('redemptions')
  @RequirePermissions(Permission.VIEW_DEALS)
  async getAllRedemptions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('dealId') dealId?: string,
    @Query('search') search?: string,
  ) {
    return this.dealService.getAllRedemptions({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status,
      dealId,
      search,
    });
  }

  @Get('meta/brands')
  @RequirePermissions(Permission.VIEW_DEALS)
  async getBrands() {
    return this.dealService.getBrands();
  }

  @Post('meta/brands')
  @RequirePermissions(Permission.MANAGE_DEALS)
  @AuditLog(null as any, ResourceType.DEAL, 'Created promotional brand')
  async createBrand(@Body() data: CreateBrandDto) {
    return this.dealService.createBrand(data);
  }

  @Put('meta/brands/:id')
  @RequirePermissions(Permission.MANAGE_DEALS)
  @AuditLog(null as any, ResourceType.DEAL, 'Updated promotional brand')
  async updateBrand(@Param('id') id: string, @Body() data: UpdateBrandDto) {
    return this.dealService.updateBrand(id, data);
  }

  @Get('meta/categories')
  @RequirePermissions(Permission.VIEW_DEALS)
  async getCategories() {
    return this.dealService.getCategories();
  }

  @Post('meta/categories')
  @RequirePermissions(Permission.MANAGE_DEALS)
  @AuditLog(null as any, ResourceType.DEAL, 'Created promotional category')
  async createCategory(@Body() data: CreateCategoryDto) {
    return this.dealService.createCategory(data);
  }

  @Put('meta/categories/:id')
  @RequirePermissions(Permission.MANAGE_DEALS)
  @AuditLog(null as any, ResourceType.DEAL, 'Updated promotional category')
  async updateCategory(
    @Param('id') id: string,
    @Body() data: UpdateCategoryDto,
  ) {
    return this.dealService.updateCategory(id, data);
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_DEALS)
  async getDealById(@Param('id') id: string) {
    return this.dealService.getDealDetail(id);
  }

  @Post()
  @RequirePermissions(Permission.MANAGE_DEALS)
  @AuditLog(null as any, ResourceType.DEAL, 'Created promotional deal')
  async createDeal(@Body() data: CreateDealDto) {
    return this.dealService.createDeal(data);
  }

  @Put(':id')
  @RequirePermissions(Permission.MANAGE_DEALS)
  @AuditLog(null as any, ResourceType.DEAL, 'Updated promotional deal')
  async updateDeal(@Param('id') id: string, @Body() data: UpdateDealDto) {
    return this.dealService.updateDeal(id, data);
  }

  @Patch(':id/toggle')
  @RequirePermissions(Permission.MANAGE_DEALS)
  @AuditLog(
    null as any,
    ResourceType.DEAL,
    'Toggled promotional deal active status',
  )
  async toggleDeal(@Param('id') id: string) {
    return this.dealService.toggleDeal(id);
  }

  @Delete(':id')
  @RequirePermissions(Permission.MANAGE_DEALS)
  @AuditLog(null as any, ResourceType.DEAL, 'Deleted promotional deal')
  async deleteDeal(@Param('id') id: string) {
    return this.dealService.deleteDeal(id);
  }
}

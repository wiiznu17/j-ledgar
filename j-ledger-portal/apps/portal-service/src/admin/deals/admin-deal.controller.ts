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
import { 
  CreateBrandDto, 
  UpdateBrandDto, 
  CreateCategoryDto, 
  UpdateCategoryDto, 
  CreateDealDto, 
  UpdateDealDto 
} from '../../modules/deals/dto/deal-admin.dto';

@Controller('admin/deals')
@UseGuards(AdminJwtGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class AdminDealController {
  constructor(private readonly dealService: DealService) {}

  @Get()
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
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
    });
  }

  @Get('redemptions')
  async getAllRedemptions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dealService.getAllRedemptions({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Get('meta/brands')
  async getBrands() {
    return this.dealService.getBrands();
  }

  @Post('meta/brands')
  async createBrand(@Body() data: CreateBrandDto) {
    return this.dealService.createBrand(data);
  }

  @Put('meta/brands/:id')
  async updateBrand(@Param('id') id: string, @Body() data: UpdateBrandDto) {
    return this.dealService.updateBrand(id, data);
  }

  @Get('meta/categories')
  async getCategories() {
    return this.dealService.getCategories();
  }

  @Post('meta/categories')
  async createCategory(@Body() data: CreateCategoryDto) {
    return this.dealService.createCategory(data);
  }

  @Put('meta/categories/:id')
  async updateCategory(@Param('id') id: string, @Body() data: UpdateCategoryDto) {
    return this.dealService.updateCategory(id, data);
  }

  @Get(':id')
  async getDealById(@Param('id') id: string) {
    return this.dealService.getDealDetail(id);
  }

  @Post()
  async createDeal(@Body() data: CreateDealDto) {
    return this.dealService.createDeal(data);
  }

  @Put(':id')
  async updateDeal(@Param('id') id: string, @Body() data: UpdateDealDto) {
    return this.dealService.updateDeal(id, data);
  }

  @Patch(':id/toggle')
  async toggleDeal(@Param('id') id: string) {
    return this.dealService.toggleDeal(id);
  }

  @Delete(':id')
  async deleteDeal(@Param('id') id: string) {
    return this.dealService.deleteDeal(id);
  }
}

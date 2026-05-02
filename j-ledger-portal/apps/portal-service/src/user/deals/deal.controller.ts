import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { DealService } from '../../modules/deals/deal.service';
import { JwtAuthGuard } from '../../core/common/guards/jwt-auth.guard';

@Controller('deals')
@UseGuards(JwtAuthGuard)
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @Get('categories')
  async getCategories() {
    return this.dealService.getCategories();
  }

  @Get()
  async getDeals(
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('search') search?: string,
  ) {
    return this.dealService.getDeals({ categoryId, brandId, search });
  }

  @Get('my-redemptions')
  async getMyRedemptions(@Request() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.dealService.getMyRedemptions(userId);
  }

  @Get(':id')
  async getDealDetail(@Param('id') id: string) {
    return this.dealService.getDealDetail(id);
  }

  @Post(':id/redeem')
  async redeemDeal(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.dealService.redeemDeal(userId, id);
  }

  @Post('redemptions/:id/use')
  async useRedemption(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.dealService.useRedemption(userId, id);
  }

  @Get('redemptions/:id')
  async getRedemptionDetail(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.dealService.getRedemptionDetail(userId, id);
  }
}

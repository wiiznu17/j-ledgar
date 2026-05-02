import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DealService } from './deal.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('admin/deals')
@UseGuards(JwtAuthGuard)
export class AdminDealController {
  constructor(private readonly dealService: DealService) {}

  @Get()
  async getAllDeals() {
    return this.dealService.getDeals({});
  }

  @Get('redemptions')
  async getAllRedemptions() {
    return this.dealService.getAllRedemptions();
  }

  @Get(':id')
  async getDealById(@Param('id') id: string) {
    return this.dealService.getDealDetail(id);
  }

  @Post()
  async createDeal(@Body() data: any) {
    return this.dealService.createDeal(data);
  }

  @Put(':id')
  async updateDeal(@Param('id') id: string, @Body() data: any) {
    return this.dealService.updateDeal(id, data);
  }

  @Delete(':id')
  async deleteDeal(@Param('id') id: string) {
    return this.dealService.deleteDeal(id);
  }
}

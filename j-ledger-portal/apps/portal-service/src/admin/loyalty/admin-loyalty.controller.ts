import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { LoyaltyService } from '../../modules/loyalty/loyalty.service';

@Controller('admin/loyalty')
@UseGuards(AdminJwtGuard, AdminRolesGuard)
export class AdminLoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('rules')
  async getRules() {
    return this.loyaltyService.getEarnRules();
  }

  @Put('rules/:eventType')
  async updateRule(
    @Param('eventType') eventType: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    const adminId = req.user.sub || req.user.id;
    return this.loyaltyService.updateRule(eventType, data, adminId);
  }

  @Get('stats')
  async getStats() {
    return this.loyaltyService.getLoyaltyStats();
  }

  @Get('expiry-schedule')
  async getExpirySchedule() {
    return this.loyaltyService.getExpirySchedule();
  }
}

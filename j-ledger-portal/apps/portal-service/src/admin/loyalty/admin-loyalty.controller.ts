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
import { AdminPermissionsGuard } from '../guards/admin-permissions.guard';
import { LoyaltyService } from '../../modules/loyalty/loyalty.service';
import { Permission } from '@repo/dto';
import { Permissions as RequirePermissions } from '../decorators/permissions.decorator';
import { AuditLog } from '../decorators/audit.decorator';
import { ResourceType } from '../../modules/audit/audit.service';

@Controller('admin/loyalty')
@UseGuards(AdminJwtGuard, AdminRolesGuard, AdminPermissionsGuard)
export class AdminLoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('rules')
  @RequirePermissions(Permission.VIEW_LOYALTY)
  async getRules() {
    return this.loyaltyService.getEarnRules();
  }

  @Put('rules/:eventType')
  @RequirePermissions(Permission.MANAGE_LOYALTY)
  @AuditLog(null as any, ResourceType.LOYALTY_RULE, 'Updated points earning rule')
  async updateRule(
    @Param('eventType') eventType: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    const adminId = req.user.sub || req.user.id;
    return this.loyaltyService.updateRule(eventType, data, adminId);
  }

  @Get('stats')
  @RequirePermissions(Permission.VIEW_LOYALTY)
  async getStats() {
    return this.loyaltyService.getLoyaltyStats();
  }

  @Get('expiry-schedule')
  @RequirePermissions(Permission.VIEW_LOYALTY)
  async getExpirySchedule() {
    return this.loyaltyService.getExpirySchedule();
  }
}

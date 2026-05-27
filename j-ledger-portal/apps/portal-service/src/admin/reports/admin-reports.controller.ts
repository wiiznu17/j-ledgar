import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminPermissionsGuard } from '../guards/admin-permissions.guard';
import { ReportingService } from '../../modules/reporting/reporting.service';
import { Permission } from '@repo/dto';
import { Permissions as RequirePermissions } from '../decorators/permissions.decorator';

@Controller('admin/reports')
@UseGuards(AdminJwtGuard, AdminRolesGuard, AdminPermissionsGuard)
export class AdminReportsController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('analytics')
  @RequirePermissions(Permission.VIEW_RECONCILIATION_REPORTS)
  async getAnalytics(
    @Query('timeframe') timeframe?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportingService.getAdminAnalytics({
      timeframe,
      startDate,
      endDate,
    });
  }
}

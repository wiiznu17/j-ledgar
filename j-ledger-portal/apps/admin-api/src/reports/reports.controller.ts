import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/role.enum';

@Controller('admin/reports')
@UseGuards(PermissionsGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  @RequirePermissions(Permission.VIEW_STATISTICS)
  getDailyReport(@Query('date') date?: string) {
    return this.reportsService.getDailyReport(date);
  }

  @Get('monthly')
  @RequirePermissions(Permission.VIEW_STATISTICS)
  getMonthlyReport(@Query('year') year?: number, @Query('month') month?: number) {
    return this.reportsService.getMonthlyReport(year, month);
  }

  @Get('users')
  @RequirePermissions(Permission.VIEW_STATISTICS)
  getUserStatistics() {
    return this.reportsService.getUserStatistics();
  }
}

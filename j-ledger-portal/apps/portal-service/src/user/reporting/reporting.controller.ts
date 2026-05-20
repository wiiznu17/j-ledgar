import { Controller, Get, Post, Query, Param, UseGuards } from '@nestjs/common';
import { ReportingService } from '../../modules/reporting/reporting.service';
import { JwtAuthGuard } from '../../core/common/guards/jwt-auth.guard';

@Controller('reporting')
@UseGuards(JwtAuthGuard)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  // ==================== Daily Reports ====================

  @Get('daily')
  async getDailyReport(@Query('date') date?: string) {
    return this.reportingService.getDailyReport(date);
  }

  // ==================== Monthly Reports ====================

  @Get('monthly')
  async getMonthlyReport(
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    return this.reportingService.getMonthlyReport(year, month);
  }

  // ==================== User Statistics ====================

  @Get('user-statistics')
  async getUserStatistics() {
    return this.reportingService.getUserStatistics();
  }
}

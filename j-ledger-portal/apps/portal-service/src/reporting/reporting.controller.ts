import { Controller, Get, Post, Query, Param, UseGuards } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { InternalAuthGuard } from '../common/guards/internal-auth.guard';

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
  async getMonthlyReport(@Query('year') year?: number, @Query('month') month?: number) {
    return this.reportingService.getMonthlyReport(year, month);
  }

  // ==================== User Statistics ====================

  @Get('user-statistics')
  async getUserStatistics() {
    return this.reportingService.getUserStatistics();
  }

  // ==================== Reconciliation Reports ====================

  @Get('reconciliation')
  @UseGuards(InternalAuthGuard)
  async getReconciliationReports(@Query() query: any) {
    return this.reportingService.getReconciliationReports(query);
  }

  @Get('reconciliation/:id')
  @UseGuards(InternalAuthGuard)
  async getReconciliationReport(@Param('id') id: string) {
    return this.reportingService.getReconciliationReport(id);
  }

  @Post('reconciliation/run')
  @UseGuards(InternalAuthGuard)
  async runReconciliation() {
    return this.reportingService.runReconciliation();
  }
}

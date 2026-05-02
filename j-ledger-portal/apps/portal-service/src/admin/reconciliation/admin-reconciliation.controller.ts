import { Controller, Post, Get, UseGuards, Query, Param } from '@nestjs/common';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { ReportingService } from '../../modules/reporting/reporting.service';
import { AdminPaginatedResponse } from '@repo/dto';

@Controller('admin/reconciliation')
@UseGuards(AdminJwtGuard)
export class AdminReconciliationController {
  constructor(private readonly reportingService: ReportingService) {}

  @Post('run')
  async runReconciliation() {
    return this.reportingService.runReconciliation();
  }

  @Get('reports')
  async getReconciliationReports(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ): Promise<AdminPaginatedResponse<any>> {
    const response = await this.reportingService.getReconciliationReports({ page, limit });
    
    // Format to match UI expectations (PaginatedResponse)
    const content = Array.isArray(response) ? response : (response.content || []);
    const totalElements = response.totalElements || content.length;
    const totalPages = response.totalPages || 1;

    return {
      data: content,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalElements,
        totalPages: totalPages,
      },
    };
  }

  @Get('reports/:id')
  async getReconciliationReport(@Param('id') id: string) {
    return this.reportingService.getReconciliationReport(id);
  }
}

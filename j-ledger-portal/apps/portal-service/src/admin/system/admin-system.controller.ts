import { Controller, Post, Get, Put, UseGuards, Query, Param, Body } from '@nestjs/common';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { ReportingService } from '../../modules/reporting/reporting.service';
import { FinanceService } from '../../modules/integration/finance.service';
import { AdminPaginatedResponse } from '@repo/dto';

@Controller('admin/system')
@UseGuards(AdminJwtGuard)
export class AdminSystemController {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly financeService: FinanceService,
  ) {}

  @Get('settings')
  async getSettings() {
    return this.financeService.getSystemSettings();
  }

  @Put('settings')
  async updateSettings(@Body() body: any) {
    return this.financeService.updateSystemSettings(body);
  }

  @Get('fees')
  async getFees() {
    return this.financeService.getFeeConfiguration();
  }

  @Put('fees')
  async updateFees(@Body() body: any) {
    return this.financeService.updateFeeConfiguration(body);
  }

  @Get('outbox')
  async getOutbox(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('eventType') eventType?: string,
  ): Promise<AdminPaginatedResponse<any>> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skipPage = Math.max(0, pageNum - 1);
    
    const response = await this.reportingService.getOutbox({
      status,
      eventType,
      page: skipPage,
      limit: limitNum,
    });

    const content = Array.isArray(response) ? response : (response.content || []);
    const totalElements = response.totalElements || content.length;
    const totalPages = response.totalPages || Math.ceil(totalElements / limitNum) || 1;

    return {
      data: content,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalElements,
        totalPages: totalPages,
      },
    };
  }

  @Post('outbox/:id/retry')
  async retryOutbox(@Param('id') id: string) {
    return this.reportingService.retryOutbox(id);
  }
}

import { Controller, Post, Get, UseGuards, Query, Param } from '@nestjs/common';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { ReportingService } from '../../modules/reporting/reporting.service';
import { AdminPaginatedResponse } from '@repo/dto';

@Controller('admin/system')
@UseGuards(AdminJwtGuard)
export class AdminSystemController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('outbox')
  async getOutbox(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('eventType') eventType?: string,
  ): Promise<AdminPaginatedResponse<any>> {
    const skipPage = Math.max(0, page - 1);
    const response = await this.reportingService.getOutbox({
      status,
      eventType,
      page: skipPage,
      limit,
    });

    const content = response.content || [];
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

  @Post('outbox/:id/retry')
  async retryOutbox(@Param('id') id: string) {
    return this.reportingService.retryOutbox(id);
  }
}

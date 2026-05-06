import { Controller, Post, Get, UseGuards, Query, Param } from '@nestjs/common';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { ReportingService } from '../../modules/reporting/reporting.service';
import { AdminPaginatedResponse } from '@repo/dto';

@Controller('admin/system')
@UseGuards(AdminJwtGuard)
export class AdminSystemController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('outbox')
  async getOutbox(@Query() query: { status?: string; eventType?: string }) {
    return this.reportingService.getOutbox(query);
  }

  @Post('outbox/:id/retry')
  async retryOutbox(@Param('id') id: string) {
    return this.reportingService.retryOutbox(id);
  }
}

import { Controller, Post, Get, UseGuards, Query } from '@nestjs/common';
import { AdminJwtGuard } from './admin-jwt.guard';
import { ReportingService } from '../reporting/reporting.service';
import { AdminPaginatedResponse } from '@repo/dto';

@Controller('admin/system')
@UseGuards(AdminJwtGuard)
export class AdminSystemController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('outbox')
  async getOutbox() {
    return this.reportingService.getOutbox();
  }
}

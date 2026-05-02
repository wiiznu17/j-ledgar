import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuditService, AuditAction, ResourceType, AuditLogData } from './audit.service';
import { AdminPaginatedResponse } from '@repo/dto';
import { AdminJwtGuard } from '../admin/admin-jwt.guard';
import { InternalAuthGuard } from '../common/guards/internal-auth.guard';

@Controller('admin/audit')
@UseGuards(AdminJwtGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async findAll(@Query() query: any): Promise<AdminPaginatedResponse<any>> {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 50;
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    return this.auditService.findAll({
      ...query,
      page,
      limit,
      startDate,
      endDate,
    });
  }

  @Post('log')
  @UseGuards(InternalAuthGuard)
  async log(@Body() data: AuditLogData, @Req() req: any) {
    // Auto-fill IP and user agent if not provided
    const auditData: AuditLogData = {
      ...data,
      ipAddress: data.ipAddress || req.ip,
      userAgent: data.userAgent || req.headers['user-agent'],
    };
    return this.auditService.log(auditData);
  }
}

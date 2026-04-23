import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { AuditService, AuditAction, ResourceType, AuditLogData } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin/audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.auditService.findAll({
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      adminUserId: query.adminUserId,
      action: query.action as AuditAction,
      resourceType: query.resourceType as ResourceType,
      resourceId: query.resourceId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
  }

  @Post()
  log(@Body() data: AuditLogData) {
    return this.auditService.log(data);
  }
}

import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import {
  AuditService,
  AuditAction,
  ResourceType,
  AuditLogData,
} from '../../modules/audit/audit.service';
import { AdminPaginatedResponse } from '@repo/dto';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminPermissionsGuard } from '../guards/admin-permissions.guard';
import { Roles } from '../decorators/roles.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { AdminRole, Permission } from '@repo/dto';
import { InternalAuthGuard } from '../../core/common/guards/internal-auth.guard';

@Controller('admin/audit')
@UseGuards(AdminJwtGuard, AdminRolesGuard, AdminPermissionsGuard)
export class AdminAuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('stats')
  @Permissions(Permission.VIEW_AUDIT_LOGS)
  async getStats() {
    return this.auditService.getAuditStats();
  }

  @Get('logs')
  @Permissions(Permission.VIEW_AUDIT_LOGS)
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

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService, AuditAction, ResourceType } from './audit.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/role.enum';

@Controller('admin/audit')
@UseGuards(PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @RequirePermissions(Permission.VIEW_AUDIT_LOGS)
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
}

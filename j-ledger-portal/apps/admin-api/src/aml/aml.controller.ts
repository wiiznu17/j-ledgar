import { Controller, Get, Put, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AMLService } from './aml.service';
import type { AMLQuery, UpdateStatusDto, ReportToAMLDDto } from './aml.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/role.enum';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction, ResourceType } from '../audit/audit.service';

@Controller('admin/aml')
@UseGuards(PermissionsGuard)
export class AMLController {
  constructor(private readonly amlService: AMLService) {}

  @Get('suspicious-activities')
  @RequirePermissions(Permission.VIEW_SUSPICIOUS_ACTIVITIES)
  findAll(@Query() query: AMLQuery) {
    return this.amlService.findAll(query);
  }

  @Get('suspicious-activities/:id')
  @RequirePermissions(Permission.VIEW_SUSPICIOUS_ACTIVITIES)
  findOne(@Param('id') id: string) {
    return this.amlService.findOne(id);
  }

  @Put('suspicious-activities/:id/status')
  @RequirePermissions(Permission.REVIEW_SUSPICIOUS_ACTIVITIES)
  @AuditLog({
    action: AuditAction.UPDATE,
    resourceType: ResourceType.SUSPICIOUS_ACTIVITY,
    getResourceId: (req) => req.params.id,
  })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.amlService.updateStatus(id, dto);
  }

  @Post('suspicious-activities/:id/report')
  @RequirePermissions(Permission.REPORT_TO_AMLO)
  @AuditLog({
    action: AuditAction.UPDATE,
    resourceType: ResourceType.SUSPICIOUS_ACTIVITY,
    getResourceId: (req) => req.params.id,
  })
  reportToAMLO(@Param('id') id: string, @Body() dto: ReportToAMLDDto) {
    return this.amlService.reportToAMLO(id, dto);
  }
}

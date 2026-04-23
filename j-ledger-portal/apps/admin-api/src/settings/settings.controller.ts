import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/role.enum';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction, ResourceType } from '../audit/audit.service';

@Controller('admin/settings')
@UseGuards(PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions(Permission.VIEW_STATISTICS)
  getSystemSettings() {
    return this.settingsService.getSystemSettings();
  }

  @Put()
  @RequirePermissions(Permission.VIEW_STATISTICS)
  @AuditLog({
    action: AuditAction.UPDATE,
    resourceType: ResourceType.SYSTEM,
    getResourceId: () => 'system-settings',
  })
  updateSystemSettings(@Body() settings: any) {
    return this.settingsService.updateSystemSettings(settings);
  }

  @Get('fees')
  @RequirePermissions(Permission.VIEW_STATISTICS)
  getFeeConfiguration() {
    return this.settingsService.getFeeConfiguration();
  }

  @Put('fees')
  @RequirePermissions(Permission.VIEW_STATISTICS)
  @AuditLog({
    action: AuditAction.UPDATE,
    resourceType: ResourceType.SYSTEM,
    getResourceId: () => 'fee-configuration',
  })
  updateFeeConfiguration(@Body() fees: any) {
    return this.settingsService.updateFeeConfiguration(fees);
  }

  @Get('limits')
  @RequirePermissions(Permission.VIEW_STATISTICS)
  getLimitConfiguration() {
    return this.settingsService.getLimitConfiguration();
  }

  @Put('limits')
  @RequirePermissions(Permission.VIEW_STATISTICS)
  @AuditLog({
    action: AuditAction.UPDATE,
    resourceType: ResourceType.SYSTEM,
    getResourceId: () => 'limit-configuration',
  })
  updateLimitConfiguration(@Body() limits: any) {
    return this.settingsService.updateLimitConfiguration(limits);
  }
}

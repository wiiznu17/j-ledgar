import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/role.enum';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction, ResourceType } from '../audit/audit.service';

@Controller('admin/system')
@UseGuards(PermissionsGuard)
export class AdminSystemController {
  private maintenanceMode = false;

  @Post('maintenance')
  @RequirePermissions(Permission.VIEW_STATISTICS)
  @AuditLog({
    action: AuditAction.UPDATE,
    resourceType: ResourceType.SYSTEM,
    getResourceId: () => 'maintenance-mode',
  })
  toggleMaintenance(@Body('enabled') enabled: boolean) {
    this.maintenanceMode = enabled;
    return { maintenanceMode: this.maintenanceMode };
  }

  @Get('health')
  @RequirePermissions(Permission.VIEW_STATISTICS)
  getHealth() {
    return {
      status: 'healthy',
      maintenanceMode: this.maintenanceMode,
      timestamp: new Date().toISOString(),
      services: {
        adminApi: 'healthy',
        coreService: 'healthy',
        authService: 'healthy',
        walletService: 'healthy',
        kycService: 'healthy',
      },
    };
  }
}

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { AdminRole, Permission } from '@repo/dto';
import { AuditLog } from '../decorators/audit.decorator';
import { Permissions as RequirePermissions } from '../decorators/permissions.decorator';
import { ResourceType } from '../../modules/audit/audit.service';

@Controller('admin')
@UseGuards(AdminJwtGuard, AdminRolesGuard)
export class AdminStaffController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== Staff Endpoints ====================

  @Get('staff')
  async findAllStaff(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.findAllStaff(Number(page), Number(limit), { search, role, status });
  }

  @Get('staff/:id')
  async findStaffById(@Param('id') id: string) {
    return this.adminService.findById(id);
  }

  @Get('staff/search')
  async searchStaff(@Query('q') query: string) {
    return this.adminService.searchStaff(query);
  }

  @Post('staff')
  @Roles(AdminRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CREATE_ADMINS)
  @AuditLog(null as any, ResourceType.ADMIN_USER, 'Created new staff member')
  async createStaff(@Body() data: any) {
    return this.adminService.createStaff(data);
  }

  @Put('staff/:id')
  @Roles(AdminRole.SUPER_ADMIN)
  @RequirePermissions(Permission.MANAGE_STAFF)
  @AuditLog(null as any, ResourceType.ADMIN_USER, 'Updated staff profile')
  async updateStaff(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateStaff(id, data);
  }

  @Delete('staff/:id')
  @Roles(AdminRole.SUPER_ADMIN)
  @RequirePermissions(Permission.DELETE_ADMINS)
  @AuditLog(null as any, ResourceType.ADMIN_USER, 'Removed staff member')
  async removeStaff(@Param('id') id: string) {
    return this.adminService.removeStaff(id);
  }

  @Post('staff/:id/reset-password')
  @Roles(AdminRole.SUPER_ADMIN)
  @RequirePermissions(Permission.RESET_STAFF_PASSWORD)
  @AuditLog(null as any, ResourceType.ADMIN_USER, 'Reset staff password')
  async resetPassword(@Param('id') id: string) {
    return this.adminService.requestPasswordReset(id, false);
  }

  @Post('staff/:id/resend-invite')
  @Roles(AdminRole.SUPER_ADMIN)
  @RequirePermissions(Permission.CREATE_ADMINS)
  @AuditLog(null as any, ResourceType.ADMIN_USER, 'Resent staff invitation')
  async resendInvite(@Param('id') id: string) {
    return this.adminService.requestPasswordReset(id, true);
  }

  @Post('staff/:id/deactivate')
  @RequirePermissions(Permission.DEACTIVATE_STAFF)
  @AuditLog(null as any, ResourceType.ADMIN_USER, 'Deactivated staff account')
  async deactivateStaff(@Param('id') id: string) {
    return this.adminService.deactivateStaff(id);
  }

  @Post('staff/:id/reactivate')
  @RequirePermissions(Permission.REACTIVATE_STAFF)
  @AuditLog(null as any, ResourceType.ADMIN_USER, 'Reactivated staff account')
  async reactivateStaff(@Param('id') id: string) {
    return this.adminService.reactivateStaff(id);
  }

  @Post('staff/:staffId/roles/:roleId')
  @RequirePermissions(Permission.ASSIGN_STAFF_ROLES)
  @AuditLog(null as any, ResourceType.ADMIN_USER, 'Assigned role to staff')
  async assignRole(@Param('staffId') staffId: string, @Param('roleId') roleId: string) {
    return this.adminService.assignRole(staffId, roleId);
  }

  @Delete('staff/:staffId/roles/:roleId')
  @RequirePermissions(Permission.ASSIGN_STAFF_ROLES)
  @AuditLog(null as any, ResourceType.ADMIN_USER, 'Removed role from staff')
  async removeRole(@Param('staffId') staffId: string, @Param('roleId') roleId: string) {
    return this.adminService.removeRole(staffId, roleId);
  }

  // ==================== Role Endpoints ====================

  @Get('roles')
  async findAllRoles() {
    return this.adminService.findAllRoles();
  }

  @Get('roles/:id')
  async findRoleById(@Param('id') id: string) {
    return this.adminService.findRoleById(id);
  }

  @Post('roles')
  @Roles(AdminRole.SUPER_ADMIN)
  @RequirePermissions(Permission.MANAGE_SYSTEM_ROLES)
  @AuditLog(null as any, ResourceType.ROLE, 'Created new role')
  async createRole(@Body() data: any) {
    return this.adminService.createRole(data);
  }

  @Put('roles/:id')
  @RequirePermissions(Permission.MANAGE_SYSTEM_ROLES)
  @AuditLog(null as any, ResourceType.ROLE, 'Updated role metadata')
  async updateRole(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateRole(id, data);
  }

  @Put('roles/:id/permissions')
  @Roles(AdminRole.SUPER_ADMIN)
  @RequirePermissions(Permission.MANAGE_SYSTEM_PERMISSIONS)
  @AuditLog(null as any, ResourceType.ROLE, 'Synchronized role permissions')
  async syncPermissions(@Param('id') id: string, @Body() data: { permissionIds: string[] }) {
    return this.adminService.syncRolePermissions(id, data.permissionIds);
  }

  @Delete('roles/:roleId/permissions/:permissionId')
  @RequirePermissions(Permission.MANAGE_SYSTEM_PERMISSIONS)
  @AuditLog(null as any, ResourceType.ROLE, 'Removed permission from role')
  async removePermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.adminService.removePermission(roleId, permissionId);
  }

  // ==================== Permission Endpoints ====================

  @Get('permissions')
  async findAllPermissions() {
    return this.adminService.findAllPermissions();
  }

  @Get('permissions/:id')
  async findPermissionById(@Param('id') id: string) {
    return this.adminService.findPermissionById(id);
  }

  @Post('permissions')
  @Roles(AdminRole.SUPER_ADMIN)
  @RequirePermissions(Permission.MANAGE_SYSTEM_PERMISSIONS)
  @AuditLog(null as any, ResourceType.PERMISSION, 'Created new permission')
  async createPermission(@Body() data: any) {
    return this.adminService.createPermission(data);
  }

  @Put('permissions/:id')
  @RequirePermissions(Permission.MANAGE_SYSTEM_PERMISSIONS)
  @AuditLog(null as any, ResourceType.PERMISSION, 'Updated permission details')
  async updatePermission(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updatePermission(id, data);
  }
}

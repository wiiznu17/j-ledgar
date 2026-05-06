import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { AdminRole } from '@repo/dto';

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
  async createStaff(@Body() data: any) {
    return this.adminService.createStaff(data);
  }

  @Put('staff/:id')
  @Roles(AdminRole.SUPER_ADMIN)
  async updateStaff(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateStaff(id, data);
  }

  @Delete('staff/:id')
  @Roles(AdminRole.SUPER_ADMIN)
  async removeStaff(@Param('id') id: string) {
    return this.adminService.removeStaff(id);
  }

  @Post('staff/:id/reset-password')
  @Roles(AdminRole.SUPER_ADMIN)
  async resetPassword(@Param('id') id: string) {
    return this.adminService.requestPasswordReset(id, false);
  }

  @Post('staff/:id/resend-invite')
  @Roles(AdminRole.SUPER_ADMIN)
  async resendInvite(@Param('id') id: string) {
    return this.adminService.requestPasswordReset(id, true);
  }

  @Post('staff/:id/deactivate')
  async deactivateStaff(@Param('id') id: string) {
    return this.adminService.deactivateStaff(id);
  }

  @Post('staff/:id/reactivate')
  async reactivateStaff(@Param('id') id: string) {
    return this.adminService.reactivateStaff(id);
  }

  @Post('staff/:staffId/roles/:roleId')
  async assignRole(@Param('staffId') staffId: string, @Param('roleId') roleId: string) {
    return this.adminService.assignRole(staffId, roleId);
  }

  @Delete('staff/:staffId/roles/:roleId')
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
  async createRole(@Body() data: any) {
    return this.adminService.createRole(data);
  }

  @Put('roles/:id')
  async updateRole(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateRole(id, data);
  }

  @Post('roles/:roleId/permissions/:permissionId')
  async assignPermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.adminService.assignPermission(roleId, permissionId);
  }

  @Delete('roles/:roleId/permissions/:permissionId')
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
  async createPermission(@Body() data: any) {
    return this.adminService.createPermission(data);
  }

  @Put('permissions/:id')
  async updatePermission(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updatePermission(id, data);
  }
}

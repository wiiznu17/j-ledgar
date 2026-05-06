import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { IdentityService } from '../../modules/identity/identity.service';
import { AdminService } from '../services/admin.service';
import { AdminPaginatedResponse, PaginatedResponse, WalletUser } from '@repo/dto';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminPermissionsGuard } from '../guards/admin-permissions.guard';
import { Roles } from '../decorators/roles.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { AdminRole, Permission } from '@repo/dto';

@Controller('admin/users')
@UseGuards(AdminJwtGuard, AdminRolesGuard, AdminPermissionsGuard)
export class AdminUserController {
  constructor(
    private readonly identityService: IdentityService,
    private readonly adminService: AdminService,
  ) {}

  @Get()
  async getAdminUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<AdminPaginatedResponse<any>> {
    return this.adminService.findAllStaff(Number(page), Number(limit));
  }

  @Get('wallet/stats')
  @Permissions(Permission.VIEW_USERS)
  async getWalletUserStats() {
    return this.identityService.getUserStats();
  }

  @Get('wallet')
  @Permissions(Permission.VIEW_USERS)
  async getWalletUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('email') email?: string,
    @Query('phone') phone?: string,
    @Query('status') status?: string,
  ): Promise<AdminPaginatedResponse<WalletUser>> {
    return this.identityService.findAllUsers(Number(page), Number(limit), {
      email,
      phone,
      status,
    });
  }

  @Get('search')
  @Permissions(Permission.VIEW_USERS)
  async searchUsers(@Query('q') query: string) {
    return this.identityService.searchUsers(query);
  }

  @Get(':id')
  @Permissions(Permission.VIEW_USERS)
  async getUserById(@Param('id') id: string) {
    return this.identityService.findById(id);
  }

  @Get(':id/activity')
  async getUserActivity(@Param('id') id: string) {
    return this.identityService.getUserActivity(id);
  }

  @Put(':id/status')
  @Permissions(Permission.FREEZE_USERS)
  async updateUserStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.identityService.updateUserStatus(id, body.status);
  }

  @Post(':id/block')
  @Permissions(Permission.FREEZE_USERS)
  async blockUser(@Param('id') id: string, @Body() body?: { reason?: string }) {
    return this.identityService.blockUser(id, body?.reason);
  }

  @Post(':id/unblock')
  @Permissions(Permission.UNFREEZE_USERS)
  async unblockUser(@Param('id') id: string) {
    return this.identityService.unblockUser(id);
  }

  @Get('security-events')
  @Permissions(Permission.VIEW_AUDIT_LOGS)
  async getSecurityEvents(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('userId') userId?: string,
  ): Promise<AdminPaginatedResponse<any>> {
    return this.identityService.findAllSecurityEvents(Number(page), Number(limit), userId);
  }

  @Post(':id/suspend')
  @Permissions(Permission.FREEZE_USERS)
  async suspendUser(@Param('id') id: string) {
    return this.identityService.updateUserStatus(id, 'SUSPENDED');
  }

  @Post(':id/unsuspend')
  @Permissions(Permission.UNFREEZE_USERS)
  async unsuspendUser(@Param('id') id: string) {
    return this.identityService.updateUserStatus(id, 'ACTIVE');
  }
}

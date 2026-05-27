import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IdentityService } from '../../modules/identity/identity.service';
import { LoyaltyService } from '../../modules/loyalty/loyalty.service';
import { AdminService } from '../services/admin.service';
import {
  AdminPaginatedResponse,
  PaginatedResponse,
  WalletUser,
} from '@repo/dto';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminPermissionsGuard } from '../guards/admin-permissions.guard';
import { Roles } from '../decorators/roles.decorator';
import { Permissions as RequirePermissions } from '../decorators/permissions.decorator';
import { AdminRole, Permission, UserStatus } from '@repo/dto';
import { AuditLog } from '../decorators/audit.decorator';
import { ResourceType } from '../../modules/audit/audit.service';

@Controller('admin/users')
@UseGuards(AdminJwtGuard, AdminRolesGuard, AdminPermissionsGuard)
export class AdminUserController {
  constructor(
    private readonly identityService: IdentityService,
    private readonly adminService: AdminService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  @Get()
  async getAdminUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<AdminPaginatedResponse<any>> {
    return this.adminService.findAllStaff(Number(page), Number(limit));
  }

  @Get('wallet/stats')
  @RequirePermissions(Permission.VIEW_USERS)
  async getWalletUserStats() {
    return this.identityService.getUserStats();
  }

  @Get('wallet')
  @RequirePermissions(Permission.VIEW_USERS)
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
  @RequirePermissions(Permission.VIEW_USERS)
  async searchUsers(@Query('q') query: string) {
    return this.identityService.searchUsers(query);
  }

  @Get('security-events')
  @RequirePermissions(Permission.VIEW_AUDIT_LOGS)
  async getSecurityEvents(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('userId') userId?: string,
    @Query('eventType') eventType?: string,
  ): Promise<AdminPaginatedResponse<any>> {
    return this.identityService.findAllSecurityEvents(
      Number(page),
      Number(limit),
      userId,
      eventType,
    );
  }

  @Get('devices')
  @RequirePermissions(Permission.VIEW_USERS)
  async getUserDevices(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('os') os?: string,
    @Query('trustLevel') trustLevel?: string,
  ) {
    return this.identityService.findAllUserDevices(Number(page), Number(limit), {
      search,
      os,
      trustLevel,
    });
  }

  @Post('devices/:id/revoke')
  @RequirePermissions(Permission.FREEZE_USERS)
  @AuditLog(null as any, ResourceType.USER, 'Revoked user device')
  async revokeUserDevice(@Param('id') id: string) {
    return this.identityService.revokeUserDevice(id);
  }

  @Post('devices/:id/reactivate')
  @RequirePermissions(Permission.UNFREEZE_USERS)
  @AuditLog(null as any, ResourceType.USER, 'Reactivated user device')
  async reactivateUserDevice(@Param('id') id: string) {
    return this.identityService.reactivateUserDevice(id);
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_USERS)
  async getUserById(@Param('id') id: string) {
    const user = await this.identityService.findById(id);
    const loyalty = await this.loyaltyService.getUserBalance(id);
    return { data: { ...user, loyaltyPoints: loyalty.balance } };
  }

  @Get(':id/activity')
  async getUserActivity(@Param('id') id: string) {
    const activity = await this.identityService.getUserActivity(id);
    return { data: activity };
  }

  @Put(':id/status')
  @RequirePermissions(Permission.FREEZE_USERS)
  @AuditLog(null as any, ResourceType.USER, 'Updated user status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.identityService.updateUserStatus(id, body.status);
  }

  @Post(':id/block')
  @RequirePermissions(Permission.FREEZE_USERS)
  @AuditLog(null as any, ResourceType.USER, 'Blocked user account')
  async blockUser(@Param('id') id: string, @Body() body?: { reason?: string }) {
    return this.identityService.blockUser(id, body?.reason);
  }

  @Post(':id/unblock')
  @RequirePermissions(Permission.UNFREEZE_USERS)
  @AuditLog(null as any, ResourceType.USER, 'Unblocked user account')
  async unblockUser(@Param('id') id: string) {
    return this.identityService.activateUser(id);
  }

  @Post(':id/suspend')
  @RequirePermissions(Permission.FREEZE_USERS)
  @AuditLog(null as any, ResourceType.USER, 'Suspended user account')
  async suspendUser(@Param('id') id: string) {
    return this.identityService.suspendUser(id);
  }

  @Post(':id/unsuspend')
  @RequirePermissions(Permission.UNFREEZE_USERS)
  @AuditLog(null as any, ResourceType.USER, 'Activated user account')
  async unsuspendUser(@Param('id') id: string) {
    return this.identityService.activateUser(id);
  }
}

import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from './admin-jwt.guard';
import { IdentityService } from '../identity/identity.service';
import { AdminPaginatedResponse, PaginatedResponse, WalletUser } from '@repo/dto';

@Controller('admin/users')
@UseGuards(AdminJwtGuard)
export class AdminUserController {
  constructor(private readonly identityService: IdentityService) {}

  @Get()
  async getAdminUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ): Promise<AdminPaginatedResponse<any>> {
    const result = await this.identityService.findAllStaff(Number(page), Number(limit));
    return {
      data: result.data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.meta.total,
        totalPages: result.meta.totalPages,
      },
    };
  }

  @Get('wallet')
  async getWalletUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ): Promise<AdminPaginatedResponse<WalletUser>> {
    const result = await this.identityService.findAllUsers(Number(page), Number(limit));
    return {
      data: result.data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.meta.total,
        totalPages: result.meta.totalPages,
      },
    };
  }

  @Get('search')
  async searchUsers(@Query('q') query: string) {
    return this.identityService.searchUsers(query);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.identityService.findById(id);
  }

  @Get(':id/activity')
  async getUserActivity(@Param('id') id: string) {
    return this.identityService.getUserActivity(id);
  }

  @Put(':id/status')
  async updateUserStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.identityService.updateUserStatus(id, body.status);
  }

  @Post(':id/block')
  async blockUser(@Param('id') id: string, @Body() body?: { reason?: string }) {
    return this.identityService.blockUser(id, body?.reason);
  }

  @Post(':id/unblock')
  async unblockUser(@Param('id') id: string) {
    return this.identityService.unblockUser(id);
  }

  @Get('security-events')
  async getSecurityEvents(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('userId') userId?: string,
  ): Promise<AdminPaginatedResponse<any>> {
    const result = await this.identityService.findAllSecurityEvents(Number(page), Number(limit), userId);
    return {
      data: result.data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.meta.total,
        totalPages: result.meta.totalPages,
      },
    };
  }

  @Post(':id/suspend')
  async suspendUser(@Param('id') id: string) {
    return this.identityService.updateUserStatus(id, 'SUSPENDED');
  }

  @Post(':id/unsuspend')
  async unsuspendUser(@Param('id') id: string) {
    return this.identityService.updateUserStatus(id, 'ACTIVE');
  }
}

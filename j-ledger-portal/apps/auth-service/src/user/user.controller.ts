import { Controller, Get, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { InternalAuthGuard } from '../common/guards/internal-auth.guard';

@Controller('admin/users')
@UseGuards(InternalAuthGuard)
export class UserAdminController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.userService.findAllUsers(Number(page), Number(limit));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Get('search')
  async search(@Query('query') query: string) {
    return this.userService.searchUsers(query);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.userService.updateUserStatus(id, status);
  }

  @Get(':id/activity')
  async getActivity(@Param('id') id: string) {
    return this.userService.getUserActivity(id);
  }
}

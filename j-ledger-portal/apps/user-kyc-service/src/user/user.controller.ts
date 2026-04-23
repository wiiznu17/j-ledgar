import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InternalAuthGuard } from '../auth/guards/internal-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('userId/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.userService.findByUserId(userId);
  }

  @Post()
  create(@Body() data: any) {
    return this.userService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.userService.update(id, data);
  }
}

@Controller('admin/users')
@UseGuards(InternalAuthGuard)
export class UserAdminController {
  constructor(private userService: UserService) {}

  @Get(':id/kyc')
  async getKYC(@Param('id') id: string) {
    return this.userService.getUserKYC(id);
  }

  @Get(':id/pii')
  async getPII(@Param('id') id: string) {
    return this.userService.getUserPII(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateAdminDto } from './dto/create-admin.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('wallet')
  findAllWallet() {
    return this.usersService.findWalletUsers();
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() createUserDto: CreateAdminDto) {
    return this.usersService.create(createUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/freeze')
  freeze(@Param('id') id: string) {
    return this.usersService.freezeWalletUser(id);
  }
}

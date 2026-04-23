import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Controller('admin/permissions')
@UseGuards(JwtAuthGuard)
export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  @Get()
  findAll() {
    return this.permissionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionService.findById(id);
  }

  @Post()
  create(@Body() data: CreatePermissionDto) {
    return this.permissionService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: UpdatePermissionDto) {
    return this.permissionService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.permissionService.remove(id);
  }
}

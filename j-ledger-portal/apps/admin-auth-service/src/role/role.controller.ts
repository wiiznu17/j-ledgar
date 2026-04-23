import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('admin/roles')
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(private roleService: RoleService) {}

  @Get()
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roleService.findById(id);
  }

  @Post()
  create(@Body() data: CreateRoleDto) {
    return this.roleService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: UpdateRoleDto) {
    return this.roleService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }

  @Post(':roleId/permissions/:permissionId')
  assignPermission(@Param('roleId') roleId: string, @Param('permissionId') permissionId: string) {
    return this.roleService.assignPermission(roleId, permissionId);
  }

  @Delete(':roleId/permissions/:permissionId')
  removePermission(@Param('roleId') roleId: string, @Param('permissionId') permissionId: string) {
    return this.roleService.removePermission(roleId, permissionId);
  }
}

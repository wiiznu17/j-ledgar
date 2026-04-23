import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Controller('admin/staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Get()
  findAll() {
    return this.staffService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffService.findById(id);
  }

  @Post()
  create(@Body() data: CreateStaffDto) {
    return this.staffService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: UpdateStaffDto) {
    return this.staffService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.staffService.remove(id);
  }

  @Post(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.staffService.deactivate(id);
  }

  @Post(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.staffService.reactivate(id);
  }

  @Post(':id/roles/:roleId')
  assignRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.staffService.assignRole(id, roleId);
  }

  @Delete(':id/roles/:roleId')
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.staffService.removeRole(id, roleId);
  }
}

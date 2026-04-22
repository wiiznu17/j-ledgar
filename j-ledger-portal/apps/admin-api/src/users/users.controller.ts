import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/role.enum';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction, ResourceType } from '../audit/audit.service';

@Controller('users')
@UseGuards(PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('wallet')
  @RequirePermissions(Permission.VIEW_USERS)
  findAllWallet() {
    return this.usersService.findWalletUsers();
  }

  @Get()
  @RequirePermissions(Permission.VIEW_USERS)
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @RequirePermissions(Permission.CREATE_ADMINS)
  @AuditLog({
    action: AuditAction.CREATE,
    resourceType: ResourceType.ADMIN_USER,
    getResourceId: (req) => req.body.email,
  })
  create(@Body() createUserDto: CreateAdminDto) {
    return this.usersService.create(createUserDto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.DELETE_ADMINS)
  @AuditLog({
    action: AuditAction.DELETE,
    resourceType: ResourceType.ADMIN_USER,
    getResourceId: (req) => req.params.id,
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/freeze')
  @RequirePermissions(Permission.FREEZE_USERS)
  @AuditLog({
    action: AuditAction.UPDATE,
    resourceType: ResourceType.USER,
    getResourceId: (req) => req.params.id,
  })
  freeze(@Param('id') id: string) {
    return this.usersService.freezeWalletUser(id);
  }
}

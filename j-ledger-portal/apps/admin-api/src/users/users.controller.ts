import { Controller, Get, Post, Delete, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
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

  // Customer user management endpoints
  @Get('customers')
  @RequirePermissions(Permission.VIEW_USERS)
  getAllCustomers(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.usersService.getAllCustomers({ page, limit });
  }

  @Get('customers/search')
  @RequirePermissions(Permission.VIEW_USERS)
  searchCustomers(@Query('query') query: string) {
    return this.usersService.searchCustomers(query);
  }

  @Get('customers/:id')
  @RequirePermissions(Permission.VIEW_USERS)
  getCustomerById(@Param('id') id: string) {
    return this.usersService.getCustomerById(id);
  }

  @Put('customers/:id/status')
  @RequirePermissions(Permission.FREEZE_USERS)
  @AuditLog({
    action: AuditAction.UPDATE,
    resourceType: ResourceType.USER,
    getResourceId: (req) => req.params.id,
  })
  updateCustomerStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.usersService.updateCustomerStatus(id, status);
  }

  @Get('customers/:id/activity')
  @RequirePermissions(Permission.VIEW_USERS)
  getCustomerActivity(@Param('id') id: string) {
    return this.usersService.getCustomerActivity(id);
  }

  @Get('customers/:id/kyc')
  @RequirePermissions(Permission.VIEW_KYC)
  getCustomerKYC(@Param('id') id: string) {
    return this.usersService.getCustomerKYC(id);
  }

  @Get('customers/:id/pii')
  @RequirePermissions(Permission.VIEW_PII)
  @AuditLog({
    action: AuditAction.READ,
    resourceType: ResourceType.USER,
    getResourceId: (req) => req.params.id,
  })
  getCustomerPII(@Param('id') id: string, @Query('field') field: string) {
    return this.usersService.getCustomerPII(id, field);
  }

  @Get('customers/:id/wallet')
  @RequirePermissions(Permission.VIEW_ACCOUNTS)
  getCustomerWallet(@Param('id') id: string) {
    return this.usersService.getCustomerWallet(id);
  }

  @Post('customers/:id/wallet/freeze')
  @RequirePermissions(Permission.FREEZE_ACCOUNTS)
  @AuditLog({
    action: AuditAction.UPDATE,
    resourceType: ResourceType.USER,
    getResourceId: (req) => req.params.id,
  })
  freezeCustomerWallet(@Param('id') id: string) {
    return this.usersService.freezeCustomerWallet(id);
  }

  @Post('customers/:id/wallet/unfreeze')
  @RequirePermissions(Permission.UNFREEZE_ACCOUNTS)
  @AuditLog({
    action: AuditAction.UPDATE,
    resourceType: ResourceType.USER,
    getResourceId: (req) => req.params.id,
  })
  unfreezeCustomerWallet(@Param('id') id: string) {
    return this.usersService.unfreezeCustomerWallet(id);
  }
}

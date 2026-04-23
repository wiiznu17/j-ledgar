import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/role.enum';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction, ResourceType } from '../audit/audit.service';

@Controller('admin/wallets')
@UseGuards(PermissionsGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @RequirePermissions(Permission.VIEW_ACCOUNTS)
  getAllWallets() {
    return this.walletService.getAllWallets();
  }

  @Get('search')
  @RequirePermissions(Permission.VIEW_ACCOUNTS)
  searchWallets(@Query('q') query: string) {
    return this.walletService.searchWallets(query);
  }

  @Get(':userId')
  @RequirePermissions(Permission.VIEW_ACCOUNTS)
  getWallet(@Param('userId') userId: string) {
    return this.walletService.getWallet(userId);
  }

  @Post(':userId/adjust')
  @RequirePermissions(Permission.FREEZE_ACCOUNTS)
  @AuditLog({
    action: AuditAction.UPDATE,
    resourceType: ResourceType.ACCOUNT,
    getResourceId: (req) => req.params.userId,
  })
  adjustBalance(
    @Param('userId') userId: string,
    @Body() body: { amount: number; reason: string },
  ) {
    return this.walletService.adjustBalance(userId, body.amount, body.reason);
  }

  @Post(':userId/activate')
  @RequirePermissions(Permission.UNFREEZE_ACCOUNTS)
  @AuditLog({
    action: AuditAction.UPDATE,
    resourceType: ResourceType.ACCOUNT,
    getResourceId: (req) => req.params.userId,
  })
  activateWallet(@Param('userId') userId: string) {
    return this.walletService.activateWallet(userId);
  }

  @Post(':userId/deactivate')
  @RequirePermissions(Permission.FREEZE_ACCOUNTS)
  @AuditLog({
    action: AuditAction.UPDATE,
    resourceType: ResourceType.ACCOUNT,
    getResourceId: (req) => req.params.userId,
  })
  deactivateWallet(@Param('userId') userId: string) {
    return this.walletService.deactivateWallet(userId);
  }
}

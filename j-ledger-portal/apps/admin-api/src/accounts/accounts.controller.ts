import { Controller, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import type { AccountQuery, UpdateAccountStatusDto } from './accounts.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/role.enum';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction, ResourceType } from '../audit/audit.service';

@Controller('admin/accounts')
@UseGuards(PermissionsGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @RequirePermissions(Permission.VIEW_ACCOUNTS)
  findAll(@Query() query: AccountQuery) {
    return this.accountsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_ACCOUNTS)
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(id);
  }

  @Put(':id/status')
  @RequirePermissions(Permission.FREEZE_ACCOUNTS, Permission.UNFREEZE_ACCOUNTS)
  @AuditLog({
    action: AuditAction.UPDATE,
    resourceType: ResourceType.ACCOUNT,
    getResourceId: (req) => req.params.id,
  })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAccountStatusDto) {
    return this.accountsService.updateStatus(id, dto);
  }

  @Get(':id/transactions')
  @RequirePermissions(Permission.VIEW_TRANSACTIONS)
  getAccountTransactions(@Param('id') id: string, @Query() query: any) {
    return this.accountsService.getAccountTransactions(id, query);
  }

  @Get(':id/ledger-entries')
  @RequirePermissions(Permission.VIEW_LEDGER_ENTRIES)
  getAccountLedgerEntries(@Param('id') id: string) {
    return this.accountsService.getAccountLedgerEntries(id);
  }
}

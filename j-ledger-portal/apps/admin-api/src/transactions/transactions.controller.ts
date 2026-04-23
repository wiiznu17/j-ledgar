import { Controller, Get, Post, Query, Param, Body, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import type { TransactionQuery } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/role.enum';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction, ResourceType } from '../audit/audit.service';

@Controller('admin/transactions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @RequirePermissions(Permission.VIEW_TRANSACTIONS)
  findAll(@Query() query: TransactionQuery) {
    return this.transactionsService.findAll(query);
  }

  @Get('search')
  @RequirePermissions(Permission.VIEW_TRANSACTIONS)
  search(@Query() query: TransactionQuery) {
    return this.transactionsService.search(query);
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_TRANSACTION_DETAILS)
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Get(':id/ledger-entries')
  @RequirePermissions(Permission.VIEW_LEDGER_ENTRIES)
  findLedgerEntries(@Param('id') id: string) {
    return this.transactionsService.findLedgerEntries(id);
  }

  @Post(':id/flag')
  @RequirePermissions(Permission.REVIEW_SUSPICIOUS_ACTIVITIES)
  @AuditLog({
    action: AuditAction.UPDATE,
    resourceType: ResourceType.TRANSACTION,
    getResourceId: (req) => req.params.id,
  })
  flagTransaction(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.transactionsService.flagTransaction(id, body.reason);
  }

  @Get('account/:accountId')
  @RequirePermissions(Permission.VIEW_TRANSACTIONS)
  getAccountTransactions(@Param('accountId') accountId: string, @Query() query: TransactionQuery) {
    return this.transactionsService.getAccountTransactions(accountId, query);
  }
}

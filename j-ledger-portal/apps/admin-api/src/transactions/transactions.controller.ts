import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import type { TransactionQuery } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/role.enum';

@Controller('admin/transactions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @RequirePermissions(Permission.VIEW_TRANSACTIONS)
  findAll(@Query() query: TransactionQuery) {
    return this.transactionsService.findAll(query);
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

  @Get('account/:accountId')
  @RequirePermissions(Permission.VIEW_TRANSACTIONS)
  getAccountTransactions(@Param('accountId') accountId: string, @Query() query: TransactionQuery) {
    return this.transactionsService.getAccountTransactions(accountId, query);
  }
}

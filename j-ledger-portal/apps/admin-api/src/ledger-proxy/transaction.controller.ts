import { Controller, Get, UseGuards, Query, Param } from '@nestjs/common';
import { LedgerProxyService } from './ledger-proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Transaction, TransactionDetailsDto, PaginatedResponse } from '@repo/dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly proxyService: LedgerProxyService) {}

  @Get('/')
  async getAllTransactions(@Query() query: { page?: number; size?: number }) {
    return this.proxyService.forwardToGateway<PaginatedResponse<Transaction>>(
      'get', 
      '/api/v1/transactions', 
      null, 
      query
    );
  }

  @Get('reconciliation')
  async getReconciliationData(@Query() query: { date?: string }) {
    return this.proxyService.forwardToGateway('get', '/api/v1/transactions/reconciliation', null, query);
  }

  @Get('fees')
  async getFeeSummary(@Query() query: { startDate?: string; endDate?: string }) {
    return this.proxyService.forwardToGateway('get', '/api/v1/transactions/fees', null, query);
  }

  @Get(':id')
  async getTransactionById(@Param('id') id: string) {
    return this.proxyService.forwardToGateway<TransactionDetailsDto>(
      'get', 
      `/api/v1/transactions/${id}`
    );
  }
}

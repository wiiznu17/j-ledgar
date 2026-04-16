import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { LedgerProxyService } from './ledger-proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ledger-txns')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly proxyService: LedgerProxyService) {}

  @Get('/')
  async getAllTransactions(@Query() query: any) {
    return this.proxyService.forwardToGateway('get', '/api/v1/transactions', null, query);
  }

  @Get('reconciliation')
  async getReconciliationData(@Query() query: any) {
    return this.proxyService.forwardToGateway('get', '/api/v1/transactions/reconciliation', null, query);
  }

  @Get('fees')
  async getFeeSummary(@Query() query: any) {
    return this.proxyService.forwardToGateway('get', '/api/v1/transactions/fees', null, query);
  }
}

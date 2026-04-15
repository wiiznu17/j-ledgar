import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { LedgerProxyService } from './ledger-proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin/transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly proxyService: LedgerProxyService) {}

  @Get('reconciliation')
  async getReconciliationData(@Query() query: any) {
    return this.proxyService.forwardToGateway('get', '/api/core/transactions/reconciliation', query);
  }

  @Get('fees')
  async getFeeSummary(@Query() query: any) {
    return this.proxyService.forwardToGateway('get', '/api/core/transactions/fees', query);
  }
}

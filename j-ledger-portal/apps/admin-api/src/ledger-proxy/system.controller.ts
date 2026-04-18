import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { LedgerProxyService } from './ledger-proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReconciliationReport, ReconciliationSummary } from '@repo/dto';

@Controller('system')
@UseGuards(JwtAuthGuard)
export class SystemController {
  constructor(private readonly proxyService: LedgerProxyService) {}

  @Post('reconcile/trigger')
  async triggerReconciliation() {
    return this.proxyService.forwardToGateway<ReconciliationSummary>(
      'post', 
      '/api/v1/system/reconcile/trigger', 
      null
    );
  }

  @Get('reconcile/reports')
  async getReconciliationReports() {
    return this.proxyService.forwardToGateway<ReconciliationReport[]>(
      'get', 
      '/api/v1/system/reconcile/reports', 
      null
    );
  }

  @Get('outbox')
  async listOutbox() {
    return this.proxyService.forwardToGateway('get', '/api/v1/system/outbox', null);
  }
}

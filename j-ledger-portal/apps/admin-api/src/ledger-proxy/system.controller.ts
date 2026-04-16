import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { LedgerProxyService } from './ledger-proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('system')
@UseGuards(JwtAuthGuard)
export class SystemController {
  constructor(private readonly proxyService: LedgerProxyService) {}

  @Post('reconcile')
  async triggerReconciliation(@Body() data: any) {
    return this.proxyService.forwardToGateway('post', '/api/v1/system/reconcile', data);
  }

  @Get('outbox')
  async listOutbox() {
    return this.proxyService.forwardToGateway('get', '/api/v1/system/outbox', null);
  }
}

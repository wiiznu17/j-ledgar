import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { LedgerProxyService } from './ledger-proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly proxyService: LedgerProxyService) {}

  @Get()
  async getAllAccounts(@Query() query: any) {
    return this.proxyService.forwardToGateway('get', '/api/v1/accounts', null, query);
  }

  @Post('status')
  async updateAccountStatus(@Body() data: any) {
    return this.proxyService.forwardToGateway('post', '/api/v1/accounts/status', data);
  }
}

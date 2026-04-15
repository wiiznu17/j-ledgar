import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { LedgerProxyService } from './ledger-proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin/accounts')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly proxyService: LedgerProxyService) {}

  @Get()
  async getAllAccounts() {
    return this.proxyService.forwardToGateway('get', '/api/core/accounts');
  }

  @Post('status')
  async updateAccountStatus(@Body() data: any) {
    return this.proxyService.forwardToGateway('post', '/api/core/accounts/status', data);
  }
}

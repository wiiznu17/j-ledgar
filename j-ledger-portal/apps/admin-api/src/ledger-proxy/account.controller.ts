import { Controller, Get, Put, Body, UseGuards, Query, Param } from '@nestjs/common';
import { LedgerProxyService } from './ledger-proxy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly proxyService: LedgerProxyService) {}

  @Get()
  async getAllAccounts(@Query() query: any) {
    return this.proxyService.forwardToGateway('get', '/api/v1/accounts', null, query);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async updateAccountStatus(@Param('id') id: string, @Body() data: any) {
    return this.proxyService.forwardToGateway('put', `/api/v1/accounts/${id}/status`, data);
  }
}

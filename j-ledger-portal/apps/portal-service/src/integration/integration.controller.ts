import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { InternalAuthGuard } from '../common/guards/internal-auth.guard';

@Controller('integration')
@UseGuards(JwtAuthGuard)
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  // ==================== Transaction History ====================

  @Get('transactions/:userId')
  async getTransactionHistory(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('size') size?: number,
  ) {
    return this.integrationService.getTransactionHistory(userId, page, size);
  }

  @Get('transactions/details/:transactionId')
  async getTransactionDetails(@Param('transactionId') transactionId: string) {
    return this.integrationService.getTransactionDetails(transactionId);
  }

  // ==================== Ledger Proxy ====================

  @Get('accounts/:userId')
  async getAccountByUserId(@Param('userId') userId: string) {
    return this.integrationService.getAccountByUserId(userId);
  }

  @Get('proxy/*')
  @UseGuards(InternalAuthGuard)
  async proxyGet(@Param('0') path: string) {
    return this.integrationService.get(`/${path}`);
  }

  // ==================== Bank Integration ====================

  @Get('bank-integrations')
  async getBankIntegrations() {
    return this.integrationService.getBankIntegrations();
  }

  @Post('bank-integrations')
  @UseGuards(InternalAuthGuard)
  async createBankIntegration(@Body() data: any) {
    return this.integrationService.createBankIntegration(data);
  }

  @Put('bank-integrations/:id')
  @UseGuards(InternalAuthGuard)
  async updateBankIntegration(@Param('id') id: string, @Body() data: any) {
    return this.integrationService.updateBankIntegration(id, data);
  }

  @Delete('bank-integrations/:id')
  @UseGuards(InternalAuthGuard)
  async deleteBankIntegration(@Param('id') id: string) {
    return this.integrationService.deleteBankIntegration(id);
  }

  // ==================== Webhooks ====================

  @Get('webhooks')
  async getWebhooks() {
    return this.integrationService.getWebhooks();
  }

  @Post('webhooks')
  @UseGuards(InternalAuthGuard)
  async createWebhook(@Body() data: any) {
    return this.integrationService.createWebhook(data);
  }

  @Delete('webhooks/:id')
  @UseGuards(InternalAuthGuard)
  async deleteWebhook(@Param('id') id: string) {
    return this.integrationService.deleteWebhook(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { IntegrationService } from '../../modules/integration/integration.service';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { InternalAuthGuard } from '../../core/common/guards/internal-auth.guard';

@Controller('admin/integration')
@UseGuards(AdminJwtGuard)
export class AdminIntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

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

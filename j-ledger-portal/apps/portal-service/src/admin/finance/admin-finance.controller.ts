import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { IntegrationService } from '../../modules/integration/integration.service';
import { AdminPaginatedResponse, PaginatedResponse, Account, Transaction, WalletDto } from '@repo/dto';

@Controller('admin')
@UseGuards(AdminJwtGuard)
export class AdminFinanceController {
  constructor(private readonly integrationService: IntegrationService) {}

  // ==================== Account Management ====================

  @Get('accounts')
  async getAccounts(
    @Query('page') page: number = 0,
    @Query('size') size: number = 50,
  ): Promise<AdminPaginatedResponse<Account>> {
    // Proxy to finance-service
    const response = await this.integrationService.forwardToGateway<any>(
      'get',
      `/api/v1/accounts?page=${page}&size=${size}`,
    );
    
    const content = Array.isArray(response) ? response : (response.content || []);
    const totalElements = response.totalElements || content.length;
    const totalPages = response.totalPages || 1;

    return {
      data: content,
      pagination: {
        page: Number(page),
        limit: Number(size),
        total: totalElements,
        totalPages: totalPages,
      },
    };
  }

  @Get('accounts/user/:userId')
  async getAccountByUserId(@Param('userId') userId: string): Promise<Account> {
    return this.integrationService.forwardToGateway<Account>(
      'get',
      `/api/v1/accounts/user/${userId}`,
    );
  }

  @Put('accounts/:id/status')
  async updateAccountStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ): Promise<void> {
    await this.integrationService.forwardToGateway(
      'put',
      `/api/v1/accounts/${id}/status`,
      { status },
    );
  }

  // ==================== Wallet Management ====================

  @Get('wallets')
  async getWallets(
    @Query('page') page: number = 0,
    @Query('size') size: number = 20,
  ): Promise<AdminPaginatedResponse<WalletDto>> {
    const response = await this.integrationService.forwardToGateway<any>(
      'get',
      `/api/finance/wallets/admin/list?page=${page}&size=${size}`,
    );

    const content = response.content || [];
    const totalElements = response.totalElements || content.length;
    const totalPages = response.totalPages || 1;

    return {
      data: content,
      pagination: {
        page: Number(page),
        limit: Number(size),
        total: totalElements,
        totalPages: totalPages,
      },
    };
  }

  @Post('wallets/:userId/freeze')
  async freezeWallet(@Param('userId') userId: string): Promise<void> {
    await this.integrationService.forwardToGateway(
      'post',
      `/api/finance/wallets/${userId}/freeze`,
      {},
    );
  }

  @Post('wallets/:userId/unfreeze')
  async unfreezeWallet(@Param('userId') userId: string): Promise<void> {
    await this.integrationService.forwardToGateway(
      'post',
      `/api/finance/wallets/${userId}/unfreeze`,
      {},
    );
  }

  // ==================== Transaction Management ====================

  @Get('transactions')
  async getTransactions(
    @Query('page') page: number = 0,
    @Query('size') size: number = 50,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('reference') reference?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AdminPaginatedResponse<Transaction>> {
    // Build query params for gateway
    const query = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      ...(status && { status }),
      ...(type && { type }),
      ...(reference && { reference }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    // Proxy to finance-service
    const response = await this.integrationService.forwardToGateway<any>(
      'get',
      `/api/v1/transactions?${query.toString()}`,
    );
    
    const content = Array.isArray(response) ? response : (response.content || []);
    const totalElements = response.totalElements || content.length;
    const totalPages = response.totalPages || 1;

    return {
      data: content,
      pagination: {
        page: Number(page),
        limit: Number(size),
        total: totalElements,
        totalPages: totalPages,
      },
    };
  }

  @Get('transactions/:id')
  async getTransactionDetails(@Param('id') id: string): Promise<Transaction> {
    return this.integrationService.forwardToGateway<Transaction>(
      'get',
      `/api/v1/transactions/${id}`,
    );
  }

  // ==================== AML Management ====================

  @Get('aml/suspicious-activities')
  async getSuspiciousActivities(
    @Query('page') page: number = 0,
    @Query('size') size: number = 50,
  ): Promise<AdminPaginatedResponse<any>> {
    // Proxy to finance-service
    const response = await this.integrationService.forwardToGateway<any>(
      'get',
      `/api/v1/aml/suspicious-activities?page=${page}&size=${size}`,
    );
    
    // Format to match UI expectations (PaginatedResponse)
    const content = Array.isArray(response) ? response : (response.content || []);
    const totalElements = response.totalElements || content.length;
    const totalPages = response.totalPages || 1;
    
    return {
      data: content,
      pagination: {
        page: Number(page),
        limit: Number(size),
        total: totalElements,
        totalPages: totalPages,
      },
    };
  }

  @Put('aml/suspicious-activities/:id/status')
  async updateSuspiciousActivityStatus(
    @Param('id') id: string,
    @Body() data: any,
  ): Promise<void> {
    await this.integrationService.forwardToGateway(
      'put',
      `/api/v1/aml/suspicious-activities/${id}/status`,
      data,
    );
  }
}

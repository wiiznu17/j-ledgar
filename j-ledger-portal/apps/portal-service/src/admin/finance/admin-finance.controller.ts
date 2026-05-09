import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { Roles } from '../decorators/roles.decorator';
import {
  AdminRole,
  AdminPaginatedResponse,
  Account,
  Transaction,
  WalletDto,
  INTERNAL_API_PATHS,
} from '@repo/dto';

import { IntegrationService } from '../../modules/integration/integration.service';

@Controller('admin')
@UseGuards(AdminJwtGuard, AdminRolesGuard)
export class AdminFinanceController {
  private readonly logger = new Logger(AdminFinanceController.name);

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
      `${INTERNAL_API_PATHS.FINANCE.ACCOUNTS.BASE}?page=${page}&size=${size}`,
    );

    const content = Array.isArray(response) ? response : response.content || [];
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
      INTERNAL_API_PATHS.FINANCE.ACCOUNTS.USER(userId),
    );
  }

  @Put('accounts/:id/status')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.AUDITOR)
  async updateAccountStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ): Promise<void> {
    await this.integrationService.forwardToGateway(
      'put',
      INTERNAL_API_PATHS.FINANCE.ACCOUNTS.STATUS(id),
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
      `${INTERNAL_API_PATHS.FINANCE.WALLETS.ADMIN_LIST}?page=${page}&size=${size}`,
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
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.AUDITOR)
  async freezeWallet(@Param('userId') userId: string): Promise<void> {
    await this.integrationService.forwardToGateway(
      'post',
      INTERNAL_API_PATHS.FINANCE.WALLETS.FREEZE(userId),
      {},
    );
  }

  @Post('wallets/:userId/unfreeze')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.AUDITOR)
  async unfreezeWallet(@Param('userId') userId: string): Promise<void> {
    await this.integrationService.forwardToGateway(
      'post',
      INTERNAL_API_PATHS.FINANCE.WALLETS.UNFREEZE(userId),
      {},
    );
  }

  @Get('wallets/:id')
  async getWalletDetail(@Param('id') id: string): Promise<WalletDto> {
    return this.integrationService.forwardToGateway<WalletDto>(
      'get',
      INTERNAL_API_PATHS.FINANCE.WALLETS.ADMIN_DETAIL(id),
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
      `${INTERNAL_API_PATHS.FINANCE.TRANSACTIONS.BASE}?${query.toString()}`,
    );

    const content = Array.isArray(response) ? response : response.content || [];
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
      INTERNAL_API_PATHS.FINANCE.TRANSACTIONS.DETAIL(id),
    );
  }

  // ==================== AML Management ====================

  @Get('aml/suspicious-activities')
  async getSuspiciousActivities(
    @Query('page') page: number = 0,
    @Query('size') size: number = 50,
  ): Promise<AdminPaginatedResponse<any>> {
    const response = await this.integrationService.forwardToGateway<any>(
      'get',
      `${INTERNAL_API_PATHS.FINANCE.AML.SUSPICIOUS_ACTIVITIES}?page=${page}&size=${size}`,
    );

    // Format to match UI expectations (PaginatedResponse)
    const content = Array.isArray(response) ? response : response.content || [];
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
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.AUDITOR, AdminRole.COMPLIANCE_OFFICER)
  async updateSuspiciousActivityStatus(@Param('id') id: string, @Body() data: any): Promise<void> {
    await this.integrationService.forwardToGateway(
      'put',
      INTERNAL_API_PATHS.FINANCE.AML.SUSPICIOUS_ACTIVITY_STATUS(id),
      data,
    );
  }
}

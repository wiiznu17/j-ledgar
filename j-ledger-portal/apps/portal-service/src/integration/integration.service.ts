import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class IntegrationService {
  private readonly apiGatewayUrl: string;
  private readonly internalSecret: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiGatewayUrl = this.configService.get<string>('API_GATEWAY_URL', 'http://localhost:8080');
    this.internalSecret = this.configService.get<string>(
      'JLEDGER_INTERNAL_SECRET',
      'default-secret',
    );
  }

  // ==================== Ledger Proxy ====================

  async forwardToGateway<T = any>(
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    data?: unknown,
    customerAccountId?: string,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const url = `${this.apiGatewayUrl}${path}`;
    const headers = {
      'X-Internal-Secret': this.internalSecret,
      ...(customerAccountId && { 'X-Customer-Account-Id': customerAccountId }),
      ...(extraHeaders ?? {}),
    };

    const response = await this.httpService.axiosRef.request<T>({
      method: method.toUpperCase(),
      url,
      data,
      headers,
    });

    return response.data;
  }

  async getAccountByUserId(userId: string) {
    const accounts = await this.forwardToGateway('get', `/api/v1/accounts/user/${userId}`);
    return { data: accounts[0] };
  }

  async get(path: string) {
    const response = await this.forwardToGateway('get', path);
    return { data: response };
  }

  // ==================== Transaction History ====================

  async getTransactionHistory(userId: string, page: number = 0, size: number = 20) {
    const historyResponse = await this.forwardToGateway(
      'get',
      `/api/v1/transactions/user/${userId}`,
      {},
      undefined,
    );

    const formattedData = historyResponse.map((entry: any) => {
      return {
        id: entry.id,
        amount: entry.amount,
        type: entry.entryType,
        date: entry.createdAt,
        title: this.generateTransactionTitle(entry),
        status: entry.transaction?.status,
        reference: entry.transaction?.id,
      };
    });

    return {
      data: formattedData,
      meta: {
        currentPage: page,
        totalPages: Math.ceil((formattedData.length || 0) / size),
        totalItems: formattedData.length || 0,
      },
    };
  }

  async getTransactionDetails(transactionId: string) {
    return this.forwardToGateway('get', `/api/v1/transactions/${transactionId}`);
  }

  private generateTransactionTitle(entry: any): string {
    const txnType = entry.transaction?.transactionType;
    const isCredit = entry.entryType === 'CREDIT';

    if (!txnType) {
      return 'ธุรกรรมอื่นๆ';
    }

    switch (txnType) {
      case 'TOPUP':
        return 'เติมเงินเข้าบัญชี';
      case 'PAYMENT':
        return 'ชำระเงินร้านค้า';
      case 'TRANSFER':
        return isCredit ? 'รับเงินโอน' : 'โอนเงินออก';
      default:
        return 'ธุรกรรมอื่นๆ';
    }
  }

  // ==================== Bank Integration ====================

  async getBankIntegrations() {
    // TODO: Return bank integrations from Prisma
    return [];
  }

  async createBankIntegration(data: any) {
    // TODO: Create bank integration in Prisma
    return { success: true };
  }

  async updateBankIntegration(id: string, data: any) {
    // TODO: Update bank integration in Prisma
    return { success: true };
  }

  async deleteBankIntegration(id: string) {
    // TODO: Delete bank integration from Prisma
    return { success: true };
  }

  // ==================== Webhooks ====================

  async createWebhook(data: any) {
    // TODO: Create webhook in Prisma
    return { success: true };
  }

  async getWebhooks() {
    // TODO: Return webhooks from Prisma
    return [];
  }

  async deleteWebhook(id: string) {
    // TODO: Delete webhook from Prisma
    return { success: true };
  }
}

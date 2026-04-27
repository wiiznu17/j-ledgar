import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface CreateWalletRequest {
  userId: string;
  currency?: string;
}

interface WalletResponse {
  id: number;
  userId: string;
  walletId: string;
  balance: number;
  currency: string;
  status: string;
  dailyLimit: number;
  monthlyLimit: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);
  private readonly financeServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.financeServiceUrl = this.configService.get<string>(
      'FINANCE_SERVICE_URL',
      'http://finance-service:8081',
    );
  }

  async createWallet(userId: string, currency: string = 'THB'): Promise<WalletResponse> {
    const url = `${this.financeServiceUrl}/api/finance/wallets/create`;
    const body: CreateWalletRequest = { userId, currency };
    const internalSecret = this.configService.get<string>('JLEDGER_INTERNAL_SECRET');

    this.logger.log(`Creating wallet for user ${userId} at ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.post<WalletResponse>(url, body, {
          headers: {
            'X-Internal-Secret': internalSecret || '',
          },
        }),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to create wallet for user ${userId}`, error);
      throw error;
    }
  }

  async activateWallet(userId: string): Promise<WalletResponse> {
    const url = `${this.financeServiceUrl}/api/finance/wallets/${userId}/activate`;
    const internalSecret = this.configService.get<string>('JLEDGER_INTERNAL_SECRET');

    this.logger.log(`Activating wallet for user ${userId} at ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.post<WalletResponse>(
          url,
          {},
          {
            headers: {
              'X-Internal-Secret': internalSecret || '',
            },
          },
        ),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to activate wallet for user ${userId}`, error);
      throw error;
    }
  }

  async getWallet(userId: string): Promise<WalletResponse | null> {
    const url = `${this.financeServiceUrl}/api/finance/wallets/${userId}`;

    try {
      const response = await firstValueFrom(this.httpService.get<WalletResponse>(url));
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      this.logger.error(`Failed to get wallet for user ${userId}`, error);
      throw error;
    }
  }
}

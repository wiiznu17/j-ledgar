import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { URLSearchParams } from 'url';

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

interface LinkedBankAccountResponse {
  id: number;
  userId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreditTopUpRequest {
  amount: string;
  currency: string;
  externalRef: string;
  provider: 'STRIPE';
  metadata?: Record<string, any>;
}

interface P2PPreviewRequest {
  recipientPhone: string;
  amount: string;
}

interface P2PTransferRequest extends P2PPreviewRequest {
  note?: string;
  idempotencyKey: string;
}

interface GetTransactionsQuery {
  page?: number;
  size?: number;
  type?: 'TOPUP' | 'TRANSFER' | 'PAYMENT' | 'WITHDRAWAL';
  from?: string;
  to?: string;
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

  async createWallet(
    userId: string,
    currency: string = 'THB',
  ): Promise<WalletResponse> {
    const url = `${this.financeServiceUrl}/api/finance/wallets/create`;
    const body: CreateWalletRequest = { userId, currency };

    try {
      const response = await this.httpService.axiosRef.post<WalletResponse>(
        url,
        body,
        {
          headers: this.getInternalHeaders(),
        },
      );
      return response.data;
    } catch (error: any) {
      this.logCompactError(`createWallet user=${userId}`, error);
      this.rethrowAsHttpException(error, 'Failed to create wallet');
    }
  }

  async activateWallet(userId: string): Promise<WalletResponse> {
    const url = `${this.financeServiceUrl}/api/finance/wallets/${userId}/activate`;

    try {
      const response = await this.httpService.axiosRef.post<WalletResponse>(
        url,
        {},
        { headers: this.getInternalHeaders() },
      );
      return response.data;
    } catch (error: any) {
      this.logCompactError(`activateWallet user=${userId}`, error);
      this.rethrowAsHttpException(error, 'Failed to activate wallet');
    }
  }

  async getWallet(userId: string): Promise<WalletResponse | null> {
    const url = `${this.financeServiceUrl}/api/finance/wallets/${userId}`;

    try {
      const response = await this.httpService.axiosRef.get<WalletResponse>(
        url,
        {
          headers: this.getInternalHeaders(),
        },
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      this.logCompactError(`getWallet user=${userId}`, error);
      this.rethrowAsHttpException(error, 'Failed to get wallet');
    }
  }

  async getTransactions(
    userId: string,
    query?: GetTransactionsQuery,
  ): Promise<any[]> {
    const params = new URLSearchParams();
    if (query?.page !== undefined) params.set('page', String(query.page));
    if (query?.size !== undefined) params.set('size', String(query.size));
    if (query?.type) params.set('type', query.type);
    if (query?.from) params.set('from', query.from);
    if (query?.to) params.set('to', query.to);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const url = `${this.financeServiceUrl}/api/finance/wallets/${userId}/transactions${suffix}`;

    try {
      const response = await this.httpService.axiosRef.get(url, {
        headers: this.getInternalHeaders(),
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      this.logCompactError(`getTransactions user=${userId}`, error);
      this.rethrowAsHttpException(error, 'Failed to get transactions');
    }
  }

  async getLinkedBankAccounts(
    userId: string,
  ): Promise<LinkedBankAccountResponse[]> {
    const url = `${this.financeServiceUrl}/api/finance/bank-accounts/${userId}`;
    try {
      const response = await this.httpService.axiosRef.get<
        LinkedBankAccountResponse[]
      >(url, {
        headers: this.getInternalHeaders(),
      });
      return response.data ?? [];
    } catch (error: any) {
      this.logCompactError(`getLinkedBankAccounts user=${userId}`, error);
      this.rethrowAsHttpException(error, 'Failed to get linked bank accounts');
    }
  }

  async topUp(
    userId: string,
    amount: number,
    bankAccountId: number,
  ): Promise<any> {
    const url = `${this.financeServiceUrl}/api/finance/wallets/${userId}/topup/bank`;
    try {
      const response = await this.httpService.axiosRef.post(
        url,
        {
          amount: amount.toString(),
          bankAccountId: bankAccountId.toString(),
        },
        { headers: this.getInternalHeaders() },
      );
      return response.data;
    } catch (error: any) {
      this.logCompactError(`topUp user=${userId}`, error);
      this.rethrowAsHttpException(error, 'Failed to top up');
    }
  }

  async creditStripeTopUp(
    userId: string,
    payload: CreditTopUpRequest,
  ): Promise<any> {
    const url = `${this.financeServiceUrl}/api/internal/wallets/${userId}/topup/credit`;
    try {
      const response = await this.httpService.axiosRef.post(url, payload, {
        headers: this.getInternalHeaders(),
      });
      return response.data;
    } catch (error: any) {
      this.logCompactError(`creditStripeTopUp user=${userId}`, error);
      this.rethrowAsHttpException(error, 'Failed to credit top up');
    }
  }

  async previewP2PTransfer(
    fromUserId: string,
    payload: P2PPreviewRequest,
  ): Promise<any> {
    const url = `${this.financeServiceUrl}/api/finance/wallets/${fromUserId}/transfer/preview`;
    try {
      const response = await this.httpService.axiosRef.post(url, payload, {
        headers: this.getInternalHeaders(),
      });
      return response.data;
    } catch (error: any) {
      this.logCompactError(`previewP2PTransfer user=${fromUserId}`, error);
      this.rethrowAsHttpException(error, 'Failed to preview transfer');
    }
  }

  async transferByPhone(
    fromUserId: string,
    payload: P2PTransferRequest,
  ): Promise<any> {
    const url = `${this.financeServiceUrl}/api/finance/wallets/${fromUserId}/transfer/phone`;
    try {
      const response = await this.httpService.axiosRef.post(url, payload, {
        headers: this.getInternalHeaders(),
      });
      return response.data;
    } catch (error: any) {
      this.logCompactError(`transferByPhone user=${fromUserId}`, error);
      this.rethrowAsHttpException(error, 'Failed to transfer');
    }
  }

  private getInternalHeaders() {
    const internalSecret = this.configService.get<string>(
      'JLEDGER_INTERNAL_SECRET',
    );
    return {
      'X-Internal-Secret': internalSecret || '',
    };
  }

  private rethrowAsHttpException(error: any, fallbackMessage: string): never {
    const status = error?.response?.status ?? HttpStatus.BAD_GATEWAY;
    let message = error?.response?.data?.message || fallbackMessage;

    // Mapping Java errors to User-friendly messages
    if (message.includes('Insufficient balance')) {
      message = 'ยอดเงินในบัญชีไม่เพียงพอ';
    } else if (
      message.includes('Transaction conflict') ||
      message.includes('Unique index or primary key violation')
    ) {
      message = 'รายการนี้ถูกประมวลผลไปแล้ว';
    } else if (
      message.includes('Lock wait timeout') ||
      message.includes('PessimisticLockingFailureException')
    ) {
      message = 'ระบบไม่ว่างชั่วคราว กรุณาลองใหม่อีกครั้ง (Lock Timeout)';
    } else if (message.includes('Wallet not found')) {
      message = 'ไม่พบกระเป๋าเงินของผู้ใช้งาน';
    }

    throw new HttpException({ message }, status);
  }

  private logCompactError(operation: string, error: any) {
    const status = error?.response?.status ?? 'N/A';
    const message =
      error?.response?.data?.message || error?.message || 'unknown error';
    this.logger.error(
      `[FinanceService] ${operation} failed status=${status} message="${message}"`,
    );
  }
}

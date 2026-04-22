import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LedgerProxyService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get gatewayUrl() {
    const value = this.configService.get<string>('API_GATEWAY_URL');
    if (!value) {
      throw new Error('Missing required environment variable: API_GATEWAY_URL');
    }
    return value;
  }

  private get internalSecret() {
    const value = this.configService.get<string>('JLEDGER_INTERNAL_SECRET');
    if (!value) {
      throw new Error('Missing required environment variable: JLEDGER_INTERNAL_SECRET');
    }
    return value;
  }

  async forwardToGateway<T = any>(
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    data?: unknown,
    customerAccountId?: string,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const url = `${this.gatewayUrl}${path}`;
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
}

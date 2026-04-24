import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TransactionProxyService {
  private readonly coreServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.coreServiceUrl = this.configService.get<string>('CORE_SERVICE_URL', 'http://localhost:8081');
  }

  async proxyRequest(endpoint: string, data: any, headers: Record<string, string> = {}) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.coreServiceUrl}${endpoint}`, data, { headers }),
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      }
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async proxyGetRequest(endpoint: string, headers: Record<string, string> = {}) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.coreServiceUrl}${endpoint}`, { headers }),
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      }
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Transaction endpoints
  async transfer(data: any, headers: Record<string, string>) {
    return this.proxyRequest('/api/v1/transactions/transfer', data, headers);
  }

  async getTransactionHistory(userId: string, headers: Record<string, string>) {
    return this.proxyGetRequest(`/api/v1/transactions/user/${userId}`, headers);
  }

  async getTransactionDetails(id: string, headers: Record<string, string>) {
    return this.proxyGetRequest(`/api/v1/transactions/${id}`, headers);
  }
}

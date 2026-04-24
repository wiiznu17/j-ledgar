import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WalletProxyService {
  private readonly walletServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.walletServiceUrl = this.configService.get<string>('WALLET_SERVICE_URL', 'http://localhost:8082');
  }

  async proxyRequest(endpoint: string, data: any, headers: Record<string, string> = {}) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.walletServiceUrl}${endpoint}`, data, { headers }),
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
        this.httpService.get(`${this.walletServiceUrl}${endpoint}`, { headers }),
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      }
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Wallet endpoints
  async createWallet(data: any, headers: Record<string, string>) {
    return this.proxyRequest('/api/v1/wallets', data, headers);
  }

  async getBalance(userId: string, headers: Record<string, string>) {
    return this.proxyGetRequest(`/api/v1/wallets/${userId}/balance`, headers);
  }

  async topUp(data: any, headers: Record<string, string>) {
    return this.proxyRequest('/api/v1/wallets/topup', data, headers);
  }

  async p2pTransfer(data: any, headers: Record<string, string>) {
    return this.proxyRequest('/api/v1/wallets/transfer', data, headers);
  }

  async qrPayment(data: any, headers: Record<string, string>) {
    return this.proxyRequest('/api/v1/wallets/qr-payment', data, headers);
  }

  async billPayment(data: any, headers: Record<string, string>) {
    return this.proxyRequest('/api/v1/wallets/bill-payment', data, headers);
  }
}

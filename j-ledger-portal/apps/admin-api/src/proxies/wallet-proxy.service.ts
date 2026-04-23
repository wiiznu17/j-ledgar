import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WalletProxyService {
  private readonly baseUrl = process.env.WALLET_SERVICE_URL || 'http://localhost:8082';
  private readonly internalSecret =
    process.env.JLEDGER_INTERNAL_SECRET || 'jledger_ecosystem_secret_2024';

  constructor(private readonly httpService: HttpService) {}

  private get headers() {
    return {
      'X-Internal-Secret': this.internalSecret,
      'Content-Type': 'application/json',
    };
  }

  // Wallet endpoints
  async createWallet(data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/wallet/create`, data, { headers: this.headers }),
    );
    return response.data;
  }

  async getWallet(userId: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/wallet/${userId}`, { headers: this.headers }),
    );
    return response.data;
  }

  async updateBalance(userId: string, amount: number) {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/wallet/${userId}/balance`,
        { amount },
        { headers: this.headers },
      ),
    );
    return response.data;
  }

  async validateTransaction(userId: string, amount: number) {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/wallet/${userId}/validate`,
        { amount },
        { headers: this.headers },
      ),
    );
    return response.data;
  }

  async activateWallet(userId: string) {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/wallet/${userId}/activate`,
        {},
        { headers: this.headers },
      ),
    );
    return response.data;
  }

  async deactivateWallet(userId: string) {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/wallet/${userId}/deactivate`,
        {},
        { headers: this.headers },
      ),
    );
    return response.data;
  }

  async getTransactionLimits(userId: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/wallet/${userId}/limits`, { headers: this.headers }),
    );
    return response.data;
  }

  // Top-up endpoints
  async topUpBank(userId: string, data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/wallet/${userId}/topup/bank`, data, {
        headers: this.headers,
      }),
    );
    return response.data;
  }

  async topUpCounter(userId: string, data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/wallet/${userId}/topup/counter`, data, {
        headers: this.headers,
      }),
    );
    return response.data;
  }

  async topUpCash(userId: string, data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/wallet/${userId}/topup/cash`, data, {
        headers: this.headers,
      }),
    );
    return response.data;
  }

  // Transfer endpoints
  async transferByPhone(userId: string, data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/wallet/${userId}/transfer/phone`, data, {
        headers: this.headers,
      }),
    );
    return response.data;
  }

  async transferByWalletId(userId: string, data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/wallet/${userId}/transfer/wallet-id`, data, {
        headers: this.headers,
      }),
    );
    return response.data;
  }

  async transferByQR(userId: string, data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/wallet/${userId}/transfer/qr`, data, {
        headers: this.headers,
      }),
    );
    return response.data;
  }

  // QR endpoints
  async generateQR(userId: string, data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/wallet/${userId}/qr/generate`, data, {
        headers: this.headers,
      }),
    );
    return response.data;
  }

  async payQR(userId: string, data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/wallet/${userId}/qr/pay`, data, {
        headers: this.headers,
      }),
    );
    return response.data;
  }

  // Payment endpoints
  async payUtilityBill(userId: string, data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/wallet/${userId}/payment/utility`, data, {
        headers: this.headers,
      }),
    );
    return response.data;
  }

  async payCreditCardBill(userId: string, data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/wallet/${userId}/payment/credit-card`, data, {
        headers: this.headers,
      }),
    );
    return response.data;
  }

  async payMobileTopup(userId: string, data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/wallet/${userId}/payment/mobile`, data, {
        headers: this.headers,
      }),
    );
    return response.data;
  }

  // Admin endpoints
  async getAllWallets() {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/wallet/admin/wallets`, { headers: this.headers }),
    );
    return response.data;
  }

  async searchWallets(query: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/wallet/admin/wallets/search`, {
        params: { query },
        headers: this.headers,
      }),
    );
    return response.data;
  }

  async getAllTransactions() {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/wallet/admin/transactions`, { headers: this.headers }),
    );
    return response.data;
  }

  async adjustBalance(userId: string, data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/wallet/admin/${userId}/adjust`, data, {
        headers: this.headers,
      }),
    );
    return response.data;
  }

  async getWalletUsers() {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/wallet/admin/users`, { headers: this.headers }),
    );
    return response.data;
  }

  async freezeWalletUser(userId: string) {
    return this.deactivateWallet(userId);
  }

  async unfreezeWalletUser(userId: string) {
    return this.activateWallet(userId);
  }
}

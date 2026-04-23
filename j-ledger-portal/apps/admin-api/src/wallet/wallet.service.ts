import { Injectable } from '@nestjs/common';
import { WalletProxyService } from '../proxies/wallet-proxy.service';

@Injectable()
export class WalletService {
  constructor(private readonly walletProxy: WalletProxyService) {}

  async getAllWallets() {
    return this.walletProxy.getAllWallets();
  }

  async searchWallets(query: string) {
    return this.walletProxy.searchWallets(query);
  }

  async getWallet(userId: string) {
    return this.walletProxy.getWallet(userId);
  }

  async adjustBalance(userId: string, amount: number, reason: string) {
    return this.walletProxy.adjustBalance(userId, { amount, reason });
  }

  async activateWallet(userId: string) {
    return this.walletProxy.activateWallet(userId);
  }

  async deactivateWallet(userId: string) {
    return this.walletProxy.deactivateWallet(userId);
  }
}

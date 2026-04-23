import { Injectable } from '@nestjs/common';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';

@Injectable()
export class WalletService {
  constructor(private readonly ledgerProxy: LedgerProxyService) {}

  async getWallet(userId: string) {
    const accountId = await this.resolveAccountId(userId);
    return this.ledgerProxy.get(`/api/v1/accounts/${accountId}`);
  }

  async getTransactionLimits(userId: string) {
    const accountId = await this.resolveAccountId(userId);
    return this.ledgerProxy.get(`/api/v1/transaction-limits/${accountId}`);
  }

  async activateWallet(userId: string) {
    const accountId = await this.resolveAccountId(userId);
    return this.ledgerProxy.forwardToGateway('post', `/api/accounts/${accountId}/activate`, {});
  }

  private async resolveAccountId(userId: string): Promise<string> {
    const response = await this.ledgerProxy.getAccountByUserId(userId);
    return response.data.id;
  }
}

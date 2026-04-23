import { Injectable } from '@nestjs/common';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';

@Injectable()
export class SettingsService {
  constructor(private readonly ledgerProxy: LedgerProxyService) {}

  async getSystemSettings() {
    const response = await this.ledgerProxy.forwardToGateway<any>(
      'get',
      '/api/v1/system/settings',
      {},
    );
    return response.data;
  }

  async updateSystemSettings(settings: any) {
    const response = await this.ledgerProxy.forwardToGateway<any>(
      'put',
      '/api/v1/system/settings',
      {},
      settings,
    );
    return response.data;
  }

  async getFeeConfiguration() {
    const response = await this.ledgerProxy.forwardToGateway<any>(
      'get',
      '/api/v1/system/settings/fees',
      {},
    );
    return response.data;
  }

  async updateFeeConfiguration(fees: any) {
    const response = await this.ledgerProxy.forwardToGateway<any>(
      'put',
      '/api/v1/system/settings/fees',
      {},
      fees,
    );
    return response.data;
  }

  async getLimitConfiguration() {
    const response = await this.ledgerProxy.forwardToGateway<any>(
      'get',
      '/api/v1/system/settings/limits',
      {},
    );
    return response.data;
  }

  async updateLimitConfiguration(limits: any) {
    const response = await this.ledgerProxy.forwardToGateway<any>(
      'put',
      '/api/v1/system/settings/limits',
      {},
      limits,
    );
    return response.data;
  }
}

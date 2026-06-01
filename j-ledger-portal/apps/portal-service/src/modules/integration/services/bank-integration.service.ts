import { Injectable } from '@nestjs/common';

@Injectable()
export class BankIntegrationService {
  async getBankIntegrations() {
    return [];
  }

  async createBankIntegration(data: any) {
    return { success: true };
  }

  async updateBankIntegration(id: string, data: any) {
    return { success: true };
  }

  async deleteBankIntegration(id: string) {
    return { success: true };
  }
}

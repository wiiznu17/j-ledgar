import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UserKYCProxyService {
  private readonly baseUrl = process.env.USER_KYC_SERVICE_URL || 'http://localhost:3002';
  private readonly internalSecret = process.env.JLEDGER_INTERNAL_SECRET || 'jledger_ecosystem_secret_2024';

  constructor(private readonly httpService: HttpService) {}

  private get headers() {
    return {
      'X-Internal-Secret': this.internalSecret,
      'Content-Type': 'application/json',
    };
  }

  // KYC endpoints
  async getKYCStatus(userId: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/kyc/status/${userId}`, { headers: this.headers }),
    );
    return response.data;
  }

  async approveDocument(documentId: string, notes?: string) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/kyc/approve/${documentId}`, { notes }, { headers: this.headers }),
    );
    return response.data;
  }

  async rejectDocument(documentId: string, reason: string) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/kyc/reject/${documentId}`, { reason }, { headers: this.headers }),
    );
    return response.data;
  }

  async getPendingKYCList() {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/kyc/admin/pending`, { headers: this.headers }),
    );
    return response.data;
  }

  async getKYCHistory(userId: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/kyc/admin/history/${userId}`, { headers: this.headers }),
    );
    return response.data;
  }

  // Document endpoints
  async getAllDocuments() {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/kyc/documents/admin/all`, { headers: this.headers }),
    );
    return response.data;
  }

  async getUserDocuments(userId: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/kyc/documents/user/${userId}`, { headers: this.headers }),
    );
    return response.data;
  }

  // PII endpoints
  async storePII(data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/kyc/pii/store`, data, { headers: this.headers }),
    );
    return response.data;
  }

  async getPII(userId: string, field: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/kyc/pii/get/${userId}/${field}`, { headers: this.headers }),
    );
    return response.data;
  }

  async updatePII(userId: string, data: any) {
    const response = await firstValueFrom(
      this.httpService.put(`${this.baseUrl}/kyc/pii/update/${userId}`, data, { headers: this.headers }),
    );
    return response.data;
  }

  async deletePII(userId: string, field: string) {
    const response = await firstValueFrom(
      this.httpService.delete(`${this.baseUrl}/kyc/pii/delete/${userId}/${field}`, { headers: this.headers }),
    );
    return response.data;
  }

  async storeTaxId(userId: string, taxId: string) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/kyc/pii/tax-id/${userId}`, { taxId }, { headers: this.headers }),
    );
    return response.data;
  }

  async getTaxId(userId: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/kyc/pii/tax-id/${userId}`, { headers: this.headers }),
    );
    return response.data;
  }
}

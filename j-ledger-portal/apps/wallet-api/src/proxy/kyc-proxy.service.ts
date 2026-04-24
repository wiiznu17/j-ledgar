import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KycProxyService {
  private readonly kycServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.kycServiceUrl = this.configService.get<string>('USER_KYC_SERVICE_URL', 'http://localhost:3004');
  }

  async proxyRequest(endpoint: string, data: any, headers: Record<string, string> = {}) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.kycServiceUrl}${endpoint}`, data, { headers }),
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
        this.httpService.get(`${this.kycServiceUrl}${endpoint}`, { headers }),
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      }
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // KYC endpoints
  async getKycStatus(userId: string, headers: Record<string, string>) {
    return this.proxyGetRequest(`/kyc/status/${userId}`, headers);
  }

  async uploadIdCard(data: any, headers: Record<string, string>) {
    return this.proxyRequest('/kyc/upload-id-card', data, headers);
  }

  async submitSelfie(data: any, headers: Record<string, string>) {
    return this.proxyRequest('/kyc/submit-selfie', data, headers);
  }
}

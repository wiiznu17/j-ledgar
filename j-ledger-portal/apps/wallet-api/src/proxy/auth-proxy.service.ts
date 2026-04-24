import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthProxyService {
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get<string>(
      'AUTH_SERVICE_URL',
      'http://localhost:3003',
    );
  }

  async proxyRequest(endpoint: string, data: any, headers: Record<string, string> = {}) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}${endpoint}`, data, { headers }),
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
        this.httpService.get(`${this.authServiceUrl}${endpoint}`, { headers }),
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      }
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Auth endpoints
  async register(data: any) {
    return this.proxyRequest('/auth/register', data);
  }

  async login(data: any) {
    return this.proxyRequest('/auth/login', data);
  }

  async refreshToken(data: any) {
    return this.proxyRequest('/auth/refresh', data);
  }

  async verifyOtp(data: any) {
    return this.proxyRequest('/auth/verify-otp', data);
  }

  async sendOtp(data: any) {
    return this.proxyRequest('/auth/send-otp', data);
  }

  async setPin(data: any, headers: Record<string, string>) {
    return this.proxyRequest('/auth/set-pin', data, headers);
  }

  async verifyPin(data: any, headers: Record<string, string>) {
    return this.proxyRequest('/auth/verify-pin', data, headers);
  }

  // Biometric endpoints
  async enableBiometric(data: any, headers: Record<string, string>) {
    return this.proxyRequest('/biometric/enable', data, headers);
  }

  async disableBiometric(headers: Record<string, string>) {
    return this.proxyGetRequest('/biometric/disable', headers);
  }

  async verifyBiometric(data: any, headers: Record<string, string>) {
    return this.proxyRequest('/biometric/verify', data, headers);
  }

  // Settings endpoints
  async getSettings(headers: Record<string, string>) {
    return this.proxyGetRequest('/settings', headers);
  }

  async setSetting(data: any, headers: Record<string, string>) {
    return this.proxyRequest('/settings', data, headers);
  }

  async deleteSetting(key: string, headers: Record<string, string>) {
    return this.proxyGetRequest(`/settings/${key}`, headers);
  }
}

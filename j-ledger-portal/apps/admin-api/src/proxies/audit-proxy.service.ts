import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuditProxyService {
  private readonly adminAuthServiceUrl: string;
  private readonly internalSecret: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.adminAuthServiceUrl = this.configService.get<string>('ADMIN_AUTH_SERVICE_URL') || '';
    this.internalSecret = this.configService.get<string>('JLEDGER_INTERNAL_SECRET') || '';
  }

  private getHeaders() {
    return {
      'X-Internal-Secret': this.internalSecret,
      'Content-Type': 'application/json',
    };
  }

  async findAll(query: any) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.adminAuthServiceUrl}/admin/audit`, {
        headers: this.getHeaders(),
        params: query,
      }),
    );
    return response.data;
  }

  async log(data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.adminAuthServiceUrl}/admin/audit`, data, {
        headers: this.getHeaders(),
      }),
    );
    return response.data;
  }
}

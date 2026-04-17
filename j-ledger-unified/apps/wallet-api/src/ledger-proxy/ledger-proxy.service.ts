import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LedgerProxyService {
  constructor(private readonly httpService: HttpService) {}

  private readonly gatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:8080';
  private readonly internalSecret =
    process.env.JLEDGER_INTERNAL_SECRET || 'jledger_ecosystem_secret_2024';

  async forwardToGateway(
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    data?: any,
    customerAccountId?: string,
  ) {
    const url = `${this.gatewayUrl}${path}`;
    const headers = {
      'X-Internal-Secret': this.internalSecret,
      ...(customerAccountId && { 'X-Customer-Account-Id': customerAccountId }),
    };

    const response = await firstValueFrom(
      this.httpService.request({
        method,
        url,
        data,
        headers,
      }) as any,
    );

    return (response as any).data;
  }
}

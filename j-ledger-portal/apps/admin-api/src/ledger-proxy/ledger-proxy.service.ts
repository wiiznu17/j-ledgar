import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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
    params?: any,
  ) {
    const url = `${this.gatewayUrl}${path}`;
    const headers = {
      'X-Internal-Secret': this.internalSecret,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url,
          data,
          params,
          headers,
        }) as any,
      );

      return (response as any).data;
    } catch (error: any) {
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.response?.data?.message || error.message || 'Downstream request failed';
      console.error(`Proxy Error [${method.toUpperCase()}] ${url}:`, message);
      throw new HttpException(message, status);
    }
  }
}

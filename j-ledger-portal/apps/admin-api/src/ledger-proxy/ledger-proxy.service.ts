import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LedgerProxyService {
  constructor(private readonly httpService: HttpService) {}

  private readonly gatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:8080';
  private readonly internalSecret =
    process.env.JLEDGER_INTERNAL_SECRET || 'jledger_ecosystem_secret_2024';

  async forwardToGateway<T = any>(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    path: string,
    data?: unknown,
    params?: unknown,
  ): Promise<T> {
    const url = `${this.gatewayUrl}${path}`;
    const headers = {
      'X-Internal-Secret': this.internalSecret,
    };

    try {
      const response = await this.httpService.axiosRef.request<T>({
        method: method.toUpperCase(),
        url,
        data,
        params,
        headers,
      });

      return response.data;
    } catch (error: unknown) {
      // Basic type narrowing for Axios errors
      const axiosError = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = axiosError.response?.data?.message || axiosError.message || 'Downstream request failed';
      
      console.error(`Proxy Error [${method.toUpperCase()}] ${url}:`, message);
      throw new HttpException(message, status);
    }
  }
}

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthProxyService {
  private readonly baseUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3003';
  private readonly internalSecret =
    process.env.JLEDGER_INTERNAL_SECRET || 'jledger_ecosystem_secret_2024';

  constructor(private readonly httpService: HttpService) {}

  private get headers() {
    return {
      'X-Internal-Secret': this.internalSecret,
      'Content-Type': 'application/json',
    };
  }

  // Admin user management endpoints
  async getAllUsers(query: { page?: number; limit?: number }) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/admin/users`, { headers: this.headers, params: query }),
    );
    return response.data;
  }

  async getUserById(id: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/admin/users/${id}`, { headers: this.headers }),
    );
    return response.data;
  }

  async searchUsers(query: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/admin/users/search`, {
        headers: this.headers,
        params: { query },
      }),
    );
    return response.data;
  }

  async updateUserStatus(id: string, status: string) {
    const response = await firstValueFrom(
      this.httpService.put(
        `${this.baseUrl}/admin/users/${id}/status`,
        { status },
        { headers: this.headers },
      ),
    );
    return response.data;
  }

  async getUserActivity(id: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/admin/users/${id}/activity`, { headers: this.headers }),
    );
    return response.data;
  }
}

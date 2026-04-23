import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AdminAuthProxyService {
  private readonly baseUrl = process.env.ADMIN_AUTH_SERVICE_URL || 'http://localhost:3001';
  private readonly internalSecret = process.env.JLEDGER_INTERNAL_SECRET || 'jledger_ecosystem_secret_2024';

  constructor(private readonly httpService: HttpService) {}

  private get headers() {
    return {
      'X-Internal-Secret': this.internalSecret,
      'Content-Type': 'application/json',
    };
  }

  // Staff endpoints
  async getAllStaff() {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/admin/staff`, { headers: this.headers }),
    );
    return response.data;
  }

  async getStaffById(id: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/admin/staff/${id}`, { headers: this.headers }),
    );
    return response.data;
  }

  async createStaff(data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/admin/staff`, data, { headers: this.headers }),
    );
    return response.data;
  }

  async updateStaff(id: string, data: any) {
    const response = await firstValueFrom(
      this.httpService.put(`${this.baseUrl}/admin/staff/${id}`, data, { headers: this.headers }),
    );
    return response.data;
  }

  async deleteStaff(id: string) {
    const response = await firstValueFrom(
      this.httpService.delete(`${this.baseUrl}/admin/staff/${id}`, { headers: this.headers }),
    );
    return response.data;
  }

  async deactivateStaff(id: string) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/admin/staff/${id}/deactivate`, {}, { headers: this.headers }),
    );
    return response.data;
  }

  async reactivateStaff(id: string) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/admin/staff/${id}/reactivate`, {}, { headers: this.headers }),
    );
    return response.data;
  }

  async searchStaff(query: string) {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/admin/staff/search/${query}`, { headers: this.headers }),
    );
    return response.data;
  }

  async assignRole(staffId: string, roleId: string) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/admin/staff/${staffId}/roles/${roleId}`, {}, { headers: this.headers }),
    );
    return response.data;
  }

  async removeRole(staffId: string, roleId: string) {
    const response = await firstValueFrom(
      this.httpService.delete(`${this.baseUrl}/admin/staff/${staffId}/roles/${roleId}`, { headers: this.headers }),
    );
    return response.data;
  }

  // Role endpoints
  async getAllRoles() {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/admin/roles`, { headers: this.headers }),
    );
    return response.data;
  }

  async createRole(data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/admin/roles`, data, { headers: this.headers }),
    );
    return response.data;
  }

  async updateRole(id: string, data: any) {
    const response = await firstValueFrom(
      this.httpService.put(`${this.baseUrl}/admin/roles/${id}`, data, { headers: this.headers }),
    );
    return response.data;
  }

  async deleteRole(id: string) {
    const response = await firstValueFrom(
      this.httpService.delete(`${this.baseUrl}/admin/roles/${id}`, { headers: this.headers }),
    );
    return response.data;
  }

  // Permission endpoints
  async getAllPermissions() {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/admin/permissions`, { headers: this.headers }),
    );
    return response.data;
  }

  async createPermission(data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/admin/permissions`, data, { headers: this.headers }),
    );
    return response.data;
  }

  async updatePermission(id: string, data: any) {
    const response = await firstValueFrom(
      this.httpService.put(`${this.baseUrl}/admin/permissions/${id}`, data, { headers: this.headers }),
    );
    return response.data;
  }

  async deletePermission(id: string) {
    const response = await firstValueFrom(
      this.httpService.delete(`${this.baseUrl}/admin/permissions/${id}`, { headers: this.headers }),
    );
    return response.data;
  }

  // Auth endpoints
  async login(data: any) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/admin/auth/login`, data, { headers: this.headers }),
    );
    return response.data;
  }
}

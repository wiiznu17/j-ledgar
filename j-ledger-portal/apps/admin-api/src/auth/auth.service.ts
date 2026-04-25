import { Injectable } from '@nestjs/common';
import { AdminAuthProxyService } from '../proxies/admin-auth-proxy.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly adminAuthProxy: AdminAuthProxyService) {}

  async login(loginDto: LoginDto) {
    console.log('[admin-api] AuthService.login - Request:', JSON.stringify(loginDto));
    const result = await this.adminAuthProxy.login(loginDto);
    console.log('[admin-api] AuthService.login - Response:', JSON.stringify(result));
    return result;
  }

  async logout(userId: string) {
    return this.adminAuthProxy.logout(userId);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    return this.adminAuthProxy.refreshTokens(userId, refreshToken);
  }
}

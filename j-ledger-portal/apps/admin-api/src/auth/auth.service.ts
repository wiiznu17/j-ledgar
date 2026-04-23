import { Injectable } from '@nestjs/common';
import { AdminAuthProxyService } from '../proxies/admin-auth-proxy.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly adminAuthProxy: AdminAuthProxyService) {}

  async login(loginDto: LoginDto) {
    return this.adminAuthProxy.login(loginDto);
  }

  async logout(userId: string) {
    return this.adminAuthProxy.logout(userId);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    return this.adminAuthProxy.refreshTokens(userId, refreshToken);
  }
}

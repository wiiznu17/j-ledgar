import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginRequest, AuthResponse, RefreshTokenRequest } from '@repo/dto';
import { AdminJwtGuard } from './admin-jwt.guard';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginRequest): Promise<AuthResponse> {
    const staff = await this.adminService.findByEmail(dto.email);

    if (!staff || !staff.isActive) {
      throw new UnauthorizedException('Invalid credentials or account inactive');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, staff.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      sub: staff.id, 
      email: staff.email, 
      role: staff.staffRoles[0]?.role.name || 'SUPPORT_STAFF' 
    };

    const token = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { 
      expiresIn: '7d',
      secret: process.env.ADMIN_REFRESH_SECRET || 'jledger-admin-refresh-super-secret-2024-dev-key-32chars'
    });

    await this.adminService.updateRefreshTokenHash(staff.id, refreshToken);

    return {
      token,
      refreshToken,
      userId: staff.id,
      role: payload.role,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenRequest): Promise<AuthResponse> {
    const staff = await this.adminService.findById(dto.userId);
    if (!staff || !staff.isActive || !staff.refreshTokenHash) {
      throw new UnauthorizedException('Invalid session');
    }

    try {
      // Verify the refresh token
      const decoded = this.jwtService.verify(dto.refreshToken);
      if (decoded.sub !== staff.id) {
        throw new UnauthorizedException('Invalid token owner');
      }

      // Check hash against DB
      const isHashValid = await bcrypt.compare(dto.refreshToken, staff.refreshTokenHash);
      if (!isHashValid) {
        throw new UnauthorizedException('Invalid session');
      }

      const payload = { 
        sub: staff.id, 
        email: staff.email, 
        role: staff.staffRoles[0]?.role.name || 'SUPPORT_STAFF' 
      };

      const token = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, { 
        expiresIn: '7d',
        secret: process.env.ADMIN_REFRESH_SECRET || 'jledger-admin-refresh-super-secret-2024-dev-key-32chars'
      });

      await this.adminService.updateRefreshTokenHash(staff.id, refreshToken);

      return {
        token,
        refreshToken,
        userId: staff.id,
        role: payload.role,
      };
    } catch (e) {
      console.error('[AdminAuth] Refresh failed:', e.message);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  @UseGuards(AdminJwtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any) {
    await this.adminService.clearRefreshToken(req.user.sub);
    return { message: 'Logged out successfully' };
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StaffService } from '../staff/staff.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private staffService: StaffService,
    private jwtService: JwtService,
  ) {}

  async validateStaff(email: string, password: string): Promise<any> {
    const staff = await this.staffService.findByEmail(email);
    if (!staff || !staff.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = staff;
    return result;
  }

  async login(staff: any) {
    const payload = { sub: staff.id, email: staff.email };
    const [token, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '15m',
        secret: process.env.JWT_SECRET || 'jledger-local-dev-jwt-secret',
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
        secret: process.env.JWT_REFRESH_SECRET || 'jledger-local-dev-refresh-secret',
      }),
    ]);

    await this.staffService.updateRefreshTokenHash(staff.id, refreshToken);

    // Get role from staffRoles
    const role = staff.staffRoles?.[0]?.role?.name || 'SUPPORT_STAFF';

    return {
      token,
      refreshToken,
      userId: staff.id,
      user: {
        email: staff.email,
        role,
      },
      role,
    };
  }

  async refreshTokens(staffId: string, refreshToken: string) {
    const staff = await this.staffService.findById(staffId);

    if (!staff || !(staff as any).refreshTokenHash) {
      throw new UnauthorizedException('Access Denied');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, (staff as any).refreshTokenHash);

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    const payload = { sub: staff.id, email: staff.email };
    const [token, newRefreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '15m',
        secret: process.env.JWT_SECRET || 'jledger-local-dev-jwt-secret',
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
        secret: process.env.JWT_REFRESH_SECRET || 'jledger-local-dev-refresh-secret',
      }),
    ]);

    await this.staffService.updateRefreshTokenHash(staff.id, newRefreshToken);

    return {
      token,
      refreshToken: newRefreshToken,
    };
  }

  async logout(staffId: string) {
    await this.staffService.clearRefreshToken(staffId);
  }
}

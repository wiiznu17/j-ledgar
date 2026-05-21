import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  BadRequestException,
  Get,
  Put,
} from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginRequest, AuthResponse, RefreshTokenRequest } from '@repo/dto';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AuditLog } from '../decorators/audit.decorator';
import { AuditAction, ResourceType } from '../../modules/audit/audit.service';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @AuditLog(AuditAction.LOGIN, ResourceType.ADMIN_USER, 'Staff login')
  async login(@Body() dto: LoginRequest): Promise<AuthResponse> {
    const staff = await this.adminService.findByEmail(dto.email);

    if (!staff || !staff.isActive) {
      throw new UnauthorizedException(
        'Invalid credentials or account inactive',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, staff.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: staff.id,
      email: staff.email,
      role: staff.staffRoles[0]?.role.name || 'SUPPORT_STAFF',
    };

    const token = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret:
        process.env.ADMIN_REFRESH_SECRET ||
        'jledger-admin-refresh-super-secret-2024-dev-key-32chars',
    });

    await this.adminService.updateRefreshTokenHash(staff.id, refreshToken);

    const permissions = await this.adminService.getStaffPermissions(staff.id);

    return {
      token,
      refreshToken,
      userId: staff.id,
      role: payload.role,
      permissions,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenRequest): Promise<AuthResponse> {
    const staff = await this.adminService.findByIdInternal(dto.userId);
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
      const isHashValid = await bcrypt.compare(
        dto.refreshToken,
        staff.refreshTokenHash,
      );
      if (!isHashValid) {
        throw new UnauthorizedException('Invalid session');
      }

      const payload = {
        sub: staff.id,
        email: staff.email,
        role: staff.staffRoles[0]?.role.name || 'SUPPORT_STAFF',
      };

      const token = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: '7d',
        secret:
          process.env.ADMIN_REFRESH_SECRET ||
          'jledger-admin-refresh-super-secret-2024-dev-key-32chars',
      });

      await this.adminService.updateRefreshTokenHash(staff.id, refreshToken);

      const permissions = await this.adminService.getStaffPermissions(staff.id);

      return {
        token,
        refreshToken,
        userId: staff.id,
        role: payload.role,
        permissions,
      };
    } catch (e) {
      console.error('[AdminAuth] Refresh failed:', e.message);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  @UseGuards(AdminJwtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @AuditLog(AuditAction.LOGOUT, ResourceType.ADMIN_USER, 'Staff logout')
  async logout(@Req() req: any) {
    await this.adminService.clearRefreshToken(req.user.sub);
    return { message: 'Logged out successfully' };
  }

  @Post('reset-password/validate')
  @HttpCode(HttpStatus.OK)
  async validateToken(@Body() body: { token: string }) {
    const isValid = await this.adminService.validateResetToken(body.token);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired token');
    }
    return { valid: true };
  }

  @Post('reset-password/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmReset(@Body() body: { token: string; password: string }) {
    try {
      return await this.adminService.resetPasswordWithToken(
        body.token,
        body.password,
      );
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('activate/validate')
  @HttpCode(HttpStatus.OK)
  async validateInviteToken(@Body() body: { token: string }) {
    const isValid = await this.adminService.validateResetToken(body.token);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired invitation token');
    }
    return { valid: true };
  }

  @Post('activate/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmActivation(@Body() body: { token: string; password: string }) {
    try {
      return await this.adminService.resetPasswordWithToken(
        body.token,
        body.password,
      );
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @UseGuards(AdminJwtGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    return this.adminService.findById(req.user.sub);
  }

  @UseGuards(AdminJwtGuard)
  @Put('me')
  async updateMe(
    @Req() req: any,
    @Body() data: { firstName?: string; lastName?: string },
  ) {
    return this.adminService.updateStaff(req.user.sub, data);
  }
}

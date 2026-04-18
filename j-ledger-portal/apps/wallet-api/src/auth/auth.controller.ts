import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  AcceptTermsDto,
  DeviceVerifyDto,
  LoginDto,
  PinSetupDto,
  PinVerifyDto,
  RefreshTokenDto,
  RegisterCredentialsDto,
  RegisterInitDto,
  RegisterProfileDto,
  RegisterVerifyOtpDto,
} from './dto/auth.dto';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    sid: string;
    did: string;
    jti: string;
    typ?: 'access';
    scope?: 'wallet';
    exp?: number;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/init')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 300_000 } })
  async registerInit(@Body() body: RegisterInitDto, @Req() req: Request) {
    return this.authService.registerInit(body, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @Post('register/verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 180_000 } })
  async registerVerifyOtp(@Body() body: RegisterVerifyOtpDto, @Req() req: Request) {
    return this.authService.registerVerifyOtp(body, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @Post('register/accept-terms')
  @HttpCode(HttpStatus.OK)
  async acceptTerms(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: AcceptTermsDto,
    @Req() req: Request,
  ) {
    return this.authService.acceptTerms(authorization, body, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @Post('register/profile')
  @HttpCode(HttpStatus.OK)
  async registerProfile(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: RegisterProfileDto,
    @Req() req: Request,
  ) {
    return this.authService.registerProfile(authorization, body, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @Post('register/credentials')
  @HttpCode(HttpStatus.OK)
  async registerCredentials(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: RegisterCredentialsDto,
    @Req() req: Request,
  ) {
    return this.authService.registerCredentials(authorization, body, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @Post('register/complete')
  @HttpCode(HttpStatus.CREATED)
  async completeRegistration(
    @Headers('authorization') authorization: string | undefined,
    @Req() req: Request,
  ) {
    return this.authService.completeRegistration(authorization, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  async login(@Body() body: LoginDto, @Req() req: Request) {
    return this.authService.login(body, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @Post('device/verify')
  @HttpCode(HttpStatus.OK)
  async verifyDevice(@Body() body: DeviceVerifyDto, @Req() req: Request) {
    return this.authService.verifyDevice(body, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: AuthenticatedRequest) {
    if (!req.user?.sub || !req.user?.sid) {
      throw new UnauthorizedException('User is not authenticated');
    }
    await this.authService.logout(req.user);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    await this.authService.logoutAll(req.user.sub, req.user);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('pin/setup')
  @HttpCode(HttpStatus.OK)
  async setupPin(@Body() body: PinSetupDto, @Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    await this.authService.setupPin(req.user.sub, body);
    return { message: 'PIN setup successful' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('pin/verify')
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyPin(@Body() body: PinVerifyDto, @Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    await this.authService.verifyPin(req.user.sub, body);
  }

  private singleHeader(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }
}

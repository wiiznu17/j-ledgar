import {
  Body,
  Controller,
  Get,
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
  BiometricVerifyDto,
  DataDeletionRequestDto,
  DeviceVerifyDto,
  LoginDto,
  PinSetupDto,
  PinVerifyDto,
  RefreshTokenDto,
  RegisterCredentialsDto,
  RegisterInitDto,
  RegisterPasswordDto,
  RegisterPinDto,
  RegisterProfileDto,
  RegisterVerifyOtpDto,
  WithdrawConsentDto,
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
  @Throttle({ default: {}, regInit: {} })
  async registerInit(@Body() body: RegisterInitDto, @Req() req: Request) {
    return this.authService.registerInit(body, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @Post('register/verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: {}, regVerify: {} })
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

  @Post('register/password')
  @HttpCode(HttpStatus.OK)
  async registerPassword(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: RegisterPasswordDto,
    @Req() req: Request,
  ) {
    return this.authService.registerPassword(authorization, body, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @Post('register/pin')
  @HttpCode(HttpStatus.OK)
  async registerPin(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: RegisterPinDto,
    @Req() req: Request,
  ) {
    return this.authService.registerPin(authorization, body, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @Post('register/status')
  @HttpCode(HttpStatus.OK)
  async getRegisterStatus(@Headers('authorization') authorization: string | undefined) {
    return this.authService.getRegistrationStatus(authorization);
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
  @Throttle({ default: {}, login: {} })
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
  @Throttle({ default: {}, refreshToken: {} })
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
  @Throttle({ default: {}, pinVerify: {} })
  async verifyPin(@Body() body: PinVerifyDto, @Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    await this.authService.verifyPin(req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('biometric/challenge')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: {}, biometricVerify: {} })
  async generateBiometricChallenge(@Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.authService.generateBiometricChallenge(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('biometric/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: {}, biometricVerify: {} })
  async verifyBiometric(@Body() body: BiometricVerifyDto, @Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.authService.verifyBiometric(req.user.sub, body, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('consents')
  async getUserConsents(@Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.authService.getUserConsents(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('consents/withdraw')
  @HttpCode(HttpStatus.OK)
  async withdrawConsent(@Body() body: WithdrawConsentDto, @Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.authService.withdrawConsent(req.user.sub, body.consentType, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('data/export')
  async exportUserData(@Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.authService.exportUserData(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('account/delete-request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: {}, accountDeletion: {} })
  async requestAccountDeletion(@Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.authService.requestAccountDeletion(req.user.sub, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('account/delete-confirm')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: {}, accountDeletion: {} })
  async confirmAccountDeletion(@Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.authService.confirmAccountDeletion(req.user.sub, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('aml/suspicious-activities')
  async getSuspiciousActivities(@Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.authService.getSuspiciousActivities(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('aml/report-to-amlo')
  @HttpCode(HttpStatus.OK)
  async reportSuspiciousActivityToAmlo(
    @Body() body: { activityId: string },
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.authService.reportSuspiciousActivityToAmlo(body.activityId, req.user.sub);
  }

  private singleHeader(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }
}

import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IdentityService } from '../../modules/identity/identity.service';
import { JwtAuthGuard } from '../../core/common/guards/jwt-auth.guard';
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
} from '../../modules/identity/dto/auth.dto';
import { UpdateAddressDto } from '../../modules/identity/dto/address.dto';
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

@Controller('identity')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post('register/init')
  @HttpCode(HttpStatus.OK)
  @Throttle({ 'otp-send': { limit: 3, ttl: 60000 } })
  async registerInit(@Body() body: RegisterInitDto, @Req() req: Request) {
    return this.identityService.registerInit(body, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @Post('register/verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ 'otp-verify': { limit: 3, ttl: 300000 } })
  async registerVerifyOtp(
    @Body() body: RegisterVerifyOtpDto,
    @Req() req: Request,
  ) {
    return this.identityService.registerVerifyOtp(body, {
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
    return this.identityService.acceptTerms(authorization, body, {
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
    return this.identityService.registerProfile(authorization, body, {
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
    return this.identityService.registerPassword(authorization, body, {
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
    return this.identityService.registerPin(authorization, body, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @Post('register/status')
  @HttpCode(HttpStatus.OK)
  async getRegisterStatus(
    @Headers('authorization') authorization: string | undefined,
  ) {
    return this.identityService.getRegistrationStatus(authorization);
  }

  @Post('register/complete')
  @HttpCode(HttpStatus.CREATED)
  async completeRegistration(
    @Headers('authorization') authorization: string | undefined,
    @Req() req: Request,
  ) {
    return this.identityService.completeRegistration(authorization, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ login: { limit: 3, ttl: 900000 } })
  async login(@Body() body: LoginDto, @Req() req: Request) {
    console.log('[IdentityController] Login request:', {
      phoneNumber: body.phoneNumber,
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
    const result = await this.identityService.login(body, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
    console.log('[IdentityController] Login response:', {
      success: !!result,
      hasAccessToken: !!result.accessToken,
      hasRefreshToken: !!result.refreshToken,
    });
    return result;
  }

  @Post('device/verify')
  @HttpCode(HttpStatus.OK)
  async verifyDevice(@Body() body: DeviceVerifyDto, @Req() req: Request) {
    return this.identityService.verifyDevice(body, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: {}, refreshToken: {} })
  async refresh(@Body() body: RefreshTokenDto, @Req() req: Request) {
    return this.identityService.refresh(body, {
      ip: req.ip,
      userAgent: this.singleHeader(req.headers['user-agent']),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: AuthenticatedRequest) {
    if (!req.user?.sub || !req.user?.sid) {
      throw new UnauthorizedException('User is not authenticated');
    }
    await this.identityService.logout(req.user);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    await this.identityService.logoutAll(req.user.sub, req.user);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('pin/setup')
  @HttpCode(HttpStatus.OK)
  async setupPin(@Body() body: PinSetupDto, @Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    await this.identityService.setupPin(req.user.sub, body);
    return { message: 'PIN setup successful' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('pin/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: {}, pinVerify: {} })
  async verifyPin(
    @Body() body: PinVerifyDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.identityService.verifyPin(req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('biometric/challenge')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: {}, biometricVerify: {} })
  async generateBiometricChallenge(@Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.identityService.generateBiometricChallenge(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('biometric/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: {}, biometricVerify: {} })
  async verifyBiometric(
    @Body() body: BiometricVerifyDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.identityService.verifyBiometric(req.user.sub, body, {
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
    return this.identityService.getUserConsents(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('consents/withdraw')
  @HttpCode(HttpStatus.OK)
  async withdrawConsent(
    @Body() body: WithdrawConsentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.identityService.withdrawConsent(
      req.user.sub,
      body.consentType,
      {
        ip: req.ip,
        userAgent: this.singleHeader(req.headers['user-agent']),
      },
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('data/export')
  async exportUserData(@Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.identityService.exportUserData(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('pay-token')
  @HttpCode(HttpStatus.OK)
  async generatePayToken(@Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.identityService.createPayToken(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.identityService.getProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Req() req: AuthenticatedRequest, @Body() body: any) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.identityService.updateProfile(req.user.sub, body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('address/:type')
  async updateAddress(
    @Req() req: AuthenticatedRequest,
    @Req() rawReq: Request,
    @Body() body: UpdateAddressDto,
  ) {
    const userId = req.user.sub;
    const type = rawReq.params.type;
    return this.identityService.updateAddress(userId, type, body, 'MANUAL');
  }

  @UseGuards(JwtAuthGuard)
  @Post('account/delete-request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: {}, accountDeletion: {} })
  async requestAccountDeletion(@Req() req: AuthenticatedRequest) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('User is not authenticated');
    }
    return this.identityService.requestAccountDeletion(req.user.sub, {
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
    return this.identityService.confirmAccountDeletion(req.user.sub, {
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
    return this.identityService.getSuspiciousActivities(req.user.sub);
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
    return this.identityService.reportSuspiciousActivityToAmlo(
      body.activityId,
      req.user.sub,
    );
  }

  private singleHeader(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }
}

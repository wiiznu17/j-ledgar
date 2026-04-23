import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  UserStatus,
  RegistrationState,
  DeviceTrustLevel,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { REDIS_CLIENT } from './auth.constants';
import Redis from 'ioredis';
import { ISmsProvider } from '../integrations/interfaces/sms-provider.interface';
import {
  RegisterInitDto,
  RegisterVerifyOtpDto,
  LoginDto,
  RefreshTokenDto,
} from './dto/auth.dto';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const REGISTRATION_TOKEN_TTL_SECONDS = 15 * 60;
const OTP_TTL_SECONDS = 3 * 60;

interface AccessTokenPayload {
  sub: string;
  sid: string;
  did: string;
  typ?: 'access';
  jti: string;
  scope?: 'wallet';
  exp?: number;
}

interface RefreshTokenPayload {
  sub: string;
  sid: string;
  did: string;
  typ: 'refresh';
  jti: string;
  exp?: number;
}

interface RegistrationTokenPayload {
  sub: string;
  state: RegistrationState;
  typ: 'registration';
  nonce: string;
  exp?: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly registrationSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(ISmsProvider) private readonly smsProvider: ISmsProvider,
  ) {
    this.accessSecret = this.requireEnv('JWT_ACCESS_SECRET');
    this.refreshSecret = this.requireEnv('JWT_REFRESH_SECRET');
    this.registrationSecret = this.requireEnv('JWT_REGISTRATION_SECRET');
  }

  private requireEnv(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/^0/, '+66');
  }

  // ==================== Registration ====================

  async registerInit(dto: RegisterInitDto, context?: { ip?: string; userAgent?: string }) {
    const phoneNumber = this.normalizePhone(dto.phoneNumber);
    this.logger.log(`[Register] Initiating registration for ${phoneNumber}`);

    let user = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phoneNumber,
          status: UserStatus.ACTIVE,
          registrationState: RegistrationState.PENDING,
        },
      });
    }

    if (user.registrationState === RegistrationState.COMPLETED) {
      throw new ConflictException('User already registered');
    }

    const challenge = await this.createOtpChallenge(user.id, phoneNumber);
    await this.logSecurityEvent(user.id, 'REGISTER_INIT_OTP', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return {
      challengeId: challenge.id,
      expiresInSeconds: OTP_TTL_SECONDS,
    };
  }

  async registerVerifyOtp(
    dto: RegisterVerifyOtpDto,
    context?: { ip?: string; userAgent?: string },
  ) {
    const phoneNumber = this.normalizePhone(dto.phoneNumber);
    const user = await this.verifyOtpChallenge(dto.challengeId, phoneNumber, dto.otp);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { registrationState: RegistrationState.INITIATED },
    });

    await this.logSecurityEvent(user.id, 'REGISTER_OTP_VERIFIED', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return {
      regToken: await this.signRegistrationToken(user.id, RegistrationState.INITIATED),
      nextState: RegistrationState.INITIATED,
    };
  }

  // ==================== Login ====================

  async login(dto: LoginDto, context?: { ip?: string; userAgent?: string }) {
    const phoneNumber = this.normalizePhone(dto.phoneNumber);
    this.logger.log(`[Login] Attempting login for ${phoneNumber}`);

    const user = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('Password not set');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const device = await this.prisma.userDevice.upsert({
      where: {
        userId_deviceIdentifier: {
          userId: user.id,
          deviceIdentifier: dto.deviceId,
        },
      },
      update: {
        lastSeenAt: new Date(),
        trustLevel: DeviceTrustLevel.TRUSTED,
      },
      create: {
        userId: user.id,
        deviceIdentifier: dto.deviceId,
        deviceName: dto.deviceName,
        trustLevel: DeviceTrustLevel.TRUSTED,
        lastSeenAt: new Date(),
      },
    });

    const sessionId = randomUUID();
    const accessToken = await this.signAccessToken(user.id, sessionId, device.id);
    const refreshToken = await this.signRefreshToken(user.id, sessionId, device.id);

    await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
        deviceId: device.id,
        tokenHash: await bcrypt.hash(refreshToken, 10),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      },
    });

    await this.logSecurityEvent(user.id, 'LOGIN_SUCCESS', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  // ==================== Refresh Token ====================

  async refresh(dto: RefreshTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        dto.refreshToken,
        { secret: this.refreshSecret },
      );

      const session = await this.prisma.refreshSession.findFirst({
        where: {
          userId: payload.sub,
          deviceId: payload.did,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isTokenValid = await bcrypt.compare(dto.refreshToken, session.tokenHash);
      if (!isTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newSessionId = randomUUID();
      const accessToken = await this.signAccessToken(payload.sub, newSessionId, payload.did);
      const newRefreshToken = await this.signRefreshToken(payload.sub, newSessionId, payload.did);

      await this.prisma.refreshSession.update({
        where: { id: session.id },
        data: {
          tokenHash: await bcrypt.hash(newRefreshToken, 10),
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
        },
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ==================== Logout ====================

  async logout(user: { sub: string; sid: string }) {
    await this.prisma.refreshSession.updateMany({
      where: {
        userId: user.sub,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    await this.logSecurityEvent(user.sub, 'LOGOUT');
  }

  async logoutAll(userId: string, user: { sub: string }) {
    await this.prisma.refreshSession.updateMany({
      where: {
        userId: user.sub,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    await this.logSecurityEvent(user.sub, 'LOGOUT_ALL');
  }

  // ==================== Token Signing ====================

  private async signAccessToken(userId: string, sessionId: string, deviceId: string): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: userId,
      sid: sessionId,
      did: deviceId,
      typ: 'access',
      jti: randomUUID(),
      scope: 'wallet',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });
  }

  private async signRefreshToken(userId: string, sessionId: string, deviceId: string): Promise<string> {
    const payload: RefreshTokenPayload = {
      sub: userId,
      sid: sessionId,
      did: deviceId,
      typ: 'refresh',
      jti: randomUUID(),
    };

    return this.jwtService.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: REFRESH_TOKEN_TTL_SECONDS,
    });
  }

  private async signRegistrationToken(userId: string, state: RegistrationState): Promise<string> {
    const payload: RegistrationTokenPayload = {
      sub: userId,
      state,
      typ: 'registration',
      nonce: randomUUID(),
    };

    return this.jwtService.signAsync(payload, {
      secret: this.registrationSecret,
      expiresIn: REGISTRATION_TOKEN_TTL_SECONDS,
    });
  }

  // ==================== OTP ====================

  private async createOtpChallenge(userId: string, phoneNumber: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    const challenge = await this.prisma.otpChallenge.create({
      data: {
        userId,
        phoneNumber,
        code: await bcrypt.hash(code, 10),
        expiresAt,
      },
    });

    await this.smsProvider.sendMessage(phoneNumber, `Your J-Ledger verification code is: ${code}`);

    return challenge;
  }

  private async verifyOtpChallenge(challengeId: string, phoneNumber: string, otp: string) {
    const challenge = await this.prisma.otpChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new BadRequestException('Invalid challenge');
    }

    if (challenge.phoneNumber !== phoneNumber) {
      throw new BadRequestException('Phone number mismatch');
    }

    if (challenge.expiresAt < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    if (challenge.verifiedAt) {
      throw new BadRequestException('OTP already verified');
    }

    const isOtpValid = await bcrypt.compare(otp, challenge.code);
    if (!isOtpValid) {
      await this.prisma.otpChallenge.update({
        where: { id: challengeId },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid OTP');
    }

    await this.prisma.otpChallenge.update({
      where: { id: challengeId },
      data: { verifiedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: challenge.userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  // ==================== Security Events ====================

  private async logSecurityEvent(userId: string, eventType: string, metadata?: any) {
    await this.prisma.securityEvent.create({
      data: {
        userId,
        eventType: eventType as any,
        metadata: metadata || {},
      },
    });
  }

  // ==================== Placeholder Methods ====================

  async acceptTerms(authorization: string | undefined, dto: any, context?: any) {
    throw new Error('Not implemented yet');
  }

  async registerProfile(authorization: string | undefined, dto: any, context?: any) {
    throw new Error('Not implemented yet');
  }

  async registerPassword(authorization: string | undefined, dto: any, context?: any) {
    throw new Error('Not implemented yet');
  }

  async registerPin(authorization: string | undefined, dto: any, context?: any) {
    throw new Error('Not implemented yet');
  }

  async getRegistrationStatus(authorization: string | undefined) {
    throw new Error('Not implemented yet');
  }

  async completeRegistration(authorization: string | undefined, context?: any) {
    throw new Error('Not implemented yet');
  }

  async verifyDevice(dto: any, context?: any) {
    throw new Error('Not implemented yet');
  }

  async setupPin(userId: string, dto: any) {
    throw new Error('Not implemented yet');
  }

  async verifyPin(userId: string, dto: any) {
    throw new Error('Not implemented yet');
  }

  async generateBiometricChallenge(userId: string) {
    throw new Error('Not implemented yet');
  }

  async verifyBiometric(userId: string, dto: any, context?: any) {
    throw new Error('Not implemented yet');
  }

  async getUserConsents(userId: string) {
    throw new Error('Not implemented yet');
  }

  async withdrawConsent(userId: string, consentType: string, context?: any) {
    throw new Error('Not implemented yet');
  }

  async exportUserData(userId: string) {
    throw new Error('Not implemented yet');
  }

  async requestAccountDeletion(userId: string, context?: any) {
    throw new Error('Not implemented yet');
  }

  async confirmAccountDeletion(userId: string, context?: any) {
    throw new Error('Not implemented yet');
  }

  async getSuspiciousActivities(userId: string) {
    throw new Error('Not implemented yet');
  }

  async reportSuspiciousActivityToAmlo(activityId: string, userId: string) {
    throw new Error('Not implemented yet');
  }
}

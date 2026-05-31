import {
  Injectable,
  Inject,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { REDIS_CLIENT } from '../../../core/common/constants';
import Redis from 'ioredis';
import {
  UserStatus,
  RegistrationState,
  NotificationEventType,
  DeviceTrustLevel,
} from '@repo/dto';
import { LoginDto, RefreshTokenDto } from '../dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { LogMaskingUtil } from '../../../common/utils/log-masking.util';
import { IdentityUtils } from '../utils/identity.utils';
import { UserSecurityService } from './user-security.service';

export const ACCESS_TOKEN_TTL_SECONDS = 3 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
export const REGISTRATION_TOKEN_TTL_SECONDS = 15 * 60;

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  did: string;
  typ?: 'access';
  jti: string;
  scope?: 'wallet';
  pvn: boolean; // PIN Verified Now
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  did: string;
  typ: 'refresh';
  jti: string;
  exp?: number;
}

export interface RegistrationTokenPayload {
  sub: string;
  state: string;
  typ: 'registration';
  nonce: string;
  exp?: number;
}

@Injectable()
export class UserAuthService {
  private readonly logger = new Logger(UserAuthService.name);
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly registrationSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(forwardRef(() => UserSecurityService))
    private readonly userSecurityService: UserSecurityService,
  ) {
    this.accessSecret = this.requireEnv('CUSTOMER_JWT_SECRET');
    this.refreshSecret = this.requireEnv('CUSTOMER_REFRESH_SECRET');
    this.registrationSecret = this.requireEnv('CUSTOMER_REGISTRATION_SECRET');
  }

  private requireEnv(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  // ==================== Login ====================

  async login(dto: LoginDto, context?: { ip?: string; userAgent?: string }) {
    // Validate phone number format BEFORE normalization (Thai numbers must be 10 digits and start with 0)
    const inputDigits = (dto.phoneNumber || '').replace(/\D/g, '');
    if (inputDigits.length !== 10) {
      throw new BadRequestException('Phone number must be 10 digits');
    }
    if (!inputDigits.startsWith('0')) {
      throw new BadRequestException('Phone number must start with 0');
    }

    const phoneNumber = IdentityUtils.normalizePhone(dto.phoneNumber);
    const maskedPhone = LogMaskingUtil.maskPhoneNumber(phoneNumber);
    this.logger.log(`[Login] Attempting login for ${maskedPhone}`);

    const user = await this.prisma.user.findFirst({
      where: { phoneNumber: { in: IdentityUtils.getPhoneCandidates(phoneNumber) } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (
      user.status !== UserStatus.ACTIVE &&
      user.status !== UserStatus.PENDING_APPROVAL &&
      user.status !== UserStatus.REJECTED &&
      user.status !== UserStatus.INACTIVE
    ) {
      throw new UnauthorizedException('Account is not active');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('Password not set');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      await this.userSecurityService.logSecurityEvent(
        user.id,
        NotificationEventType.LOGIN_FAILURE,
        {
          ip: context?.ip,
          userAgent: context?.userAgent,
          deviceId: dto.deviceId,
        },
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Enforce 1 User = 1 Session: Revoke all existing sessions for this user
    await this.prisma.refreshSession.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    const device = await this.prisma.userDevice.findUnique({
      where: {
        userId_deviceIdentifier: {
          userId: user.id,
          deviceIdentifier: dto.deviceId,
        },
      },
    });

    const isNewDevice = !device;
    const finalDevice = await this.prisma.userDevice.upsert({
      where: {
        userId_deviceIdentifier: {
          userId: user.id,
          deviceIdentifier: dto.deviceId,
        },
      },
      update: {
        lastSeenAt: new Date(),
        trustLevel: DeviceTrustLevel.TRUSTED,
        ...(dto.pushToken && { pushToken: dto.pushToken }),
      },
      create: {
        userId: user.id,
        deviceIdentifier: dto.deviceId,
        deviceName: dto.deviceName,
        trustLevel: DeviceTrustLevel.TRUSTED,
        lastSeenAt: new Date(),
        ...(dto.pushToken && { pushToken: dto.pushToken }),
      },
    });

    if (isNewDevice) {
      await this.userSecurityService.logSecurityEvent(
        user.id,
        NotificationEventType.DEVICE_REGISTERED,
        {
          deviceId: dto.deviceId,
          deviceName: dto.deviceName,
          ip: context?.ip,
        },
      );
    }

    const sessionId = randomUUID();
    const accessToken = await this.signAccessToken(
      user.id,
      sessionId,
      finalDevice.id,
    );
    const refreshToken = await this.signRefreshToken(
      user.id,
      sessionId,
      finalDevice.id,
    );

    await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
        deviceId: finalDevice.id,
        tokenHash: await bcrypt.hash(refreshToken, 10),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        lastSeenAt: new Date(),
      },
    });

    await this.userSecurityService.logSecurityEvent(user.id, NotificationEventType.LOGIN_SUCCESS, {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    // Fetch review note if rejected
    let reviewNote = null;
    if ((user.status as UserStatus) === UserStatus.REJECTED) {
      const kyc = await this.prisma.kYCData.findUnique({
        where: { userId: user.id },
        select: { reviewNote: true },
      });
      reviewNote = kyc?.reviewNote;
    }

    // Include regToken if registration is not completed so the app can resume
    let regToken = null;
    if (
      (user.registrationState as RegistrationState) !==
      RegistrationState.COMPLETED
    ) {
      regToken = await this.signRegistrationToken(
        user.id,
        user.registrationState as RegistrationState,
      );
    }

    return {
      accessToken,
      refreshToken,
      regToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        status: user.status,
        registrationState: user.registrationState,
        reviewNote,
      },
    };
  }

  // ==================== Refresh Token ====================

  async refresh(
    dto: RefreshTokenDto,
    context?: { ip?: string; userAgent?: string },
  ) {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        dto.refreshToken,
        {
          secret: this.refreshSecret,
        },
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

      const isTokenValid = await bcrypt.compare(
        dto.refreshToken,
        session.tokenHash,
      );
      if (!isTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newSessionId = randomUUID();
      const accessToken = await this.signAccessToken(
        payload.sub,
        newSessionId,
        payload.did,
      );
      const newRefreshToken = await this.signRefreshToken(
        payload.sub,
        newSessionId,
        payload.did,
      );

      await this.prisma.refreshSession.update({
        where: { id: session.id },
        data: {
          tokenHash: await bcrypt.hash(newRefreshToken, 10),
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
          ipAddress: context?.ip || session.ipAddress,
          userAgent: context?.userAgent || session.userAgent,
          lastSeenAt: new Date(),
        },
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          phoneNumber: true,
          email: true,
          status: true,
          registrationState: true,
        },
      });

      // Fetch review note if rejected
      let reviewNote = null;
      if ((user?.status as UserStatus) === UserStatus.REJECTED) {
        const kyc = await this.prisma.kYCData.findUnique({
          where: { userId: payload.sub },
          select: { reviewNote: true },
        });
        reviewNote = kyc?.reviewNote;
      }

      // Include regToken if registration is not completed so the app can resume
      let regToken = null;
      if (
        (user?.registrationState as RegistrationState) !==
        RegistrationState.COMPLETED
      ) {
        regToken = await this.signRegistrationToken(
          user.id,
          user.registrationState,
        );
      }

      return {
        accessToken,
        refreshToken: newRefreshToken,
        regToken,
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        user: {
          ...user,
          reviewNote,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
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

    await this.userSecurityService.logSecurityEvent(user.sub, NotificationEventType.LOGOUT);
  }

  async logoutAll(userId: string, user: { sub: string }) {
    await this.prisma.refreshSession.updateMany({
      where: {
        userId: user.sub,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    await this.userSecurityService.logSecurityEvent(user.sub, NotificationEventType.LOGOUT_ALL);
  }

  // ==================== Token Signing ====================

  async signAccessToken(
    userId: string,
    sessionId: string,
    deviceId: string,
    isPinVerified: boolean = false,
  ): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: userId,
      sid: sessionId,
      did: deviceId,
      typ: 'access',
      jti: randomUUID(),
      scope: 'wallet',
      pvn: isPinVerified,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });
  }

  async signRefreshToken(
    userId: string,
    sessionId: string,
    deviceId: string,
  ): Promise<string> {
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

  async signRegistrationToken(
    userId: string,
    state: string,
  ): Promise<string> {
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

  async generateAuthResponse(
    userId: string,
    deviceId?: string,
    context?: any,
    isPinVerified: boolean = false,
  ) {
    const sessionId = randomUUID();
    const accessToken = await this.signAccessToken(
      userId,
      sessionId,
      deviceId || '',
      isPinVerified,
    );
    const refreshToken = await this.signRefreshToken(
      userId,
      sessionId,
      deviceId || '',
    );

    await this.prisma.refreshSession.create({
      data: {
        userId,
        deviceId: deviceId,
        tokenHash: await bcrypt.hash(refreshToken, 10),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        lastSeenAt: new Date(),
      },
    });

    return {
      accessToken,
      refreshToken,
      userId,
    };
  }
}

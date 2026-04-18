import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  DeviceTrustLevel,
  OtpPurpose,
  OtpStatus,
  Prisma,
  RegistrationState,
  SessionStatus,
  UserStatus,
} from '@prisma/client-wallet';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { REDIS_CLIENT } from './auth.module';
import Redis from 'ioredis';
import { ISmsProvider } from '../integrations/interfaces/sms-provider.interface';
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

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const REGISTRATION_TOKEN_TTL_SECONDS = 15 * 60;
const OTP_TTL_SECONDS = 3 * 60;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000;

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
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly registrationSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(ISmsProvider) private readonly smsProvider: ISmsProvider,
  ) {
    this.accessSecret = this.requireEnv('JWT_ACCESS_SECRET');
    this.refreshSecret = this.requireEnv('JWT_REFRESH_SECRET');
    this.registrationSecret = this.requireEnv('JWT_REGISTRATION_SECRET');
  }

  async registerInit(dto: RegisterInitDto, context?: { ip?: string; userAgent?: string }) {
    const phoneNumber = this.normalizePhone(dto.phoneNumber);
    let user = await this.userService.findByPhoneNumber(phoneNumber);

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phoneNumber,
          status: UserStatus.PENDING,
          registrationState: RegistrationState.PENDING_OTP,
        },
      });
    }

    if (user.registrationState === RegistrationState.COMPLETED) {
      throw new ConflictException('User already registered');
    }

    const challenge = await this.createOtpChallenge(user.id, phoneNumber, OtpPurpose.REGISTRATION);
    await this.logSecurityEvent(user.id, 'REGISTER_INIT_OTP', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return {
      challengeId: challenge.id,
      expiresInSeconds: OTP_TTL_SECONDS,
      ...(this.isNonProduction() ? { debugOtp: challenge.plainOtp } : {}),
    };
  }

  async registerVerifyOtp(dto: RegisterVerifyOtpDto, context?: { ip?: string; userAgent?: string }) {
    const phoneNumber = this.normalizePhone(dto.phoneNumber);
    const user = await this.verifyOtpChallenge(
      dto.challengeId,
      phoneNumber,
      dto.otp,
      OtpPurpose.REGISTRATION,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { registrationState: RegistrationState.OTP_VERIFIED },
    });

    await this.logSecurityEvent(user.id, 'REGISTER_OTP_VERIFIED', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return {
      regToken: await this.signRegistrationToken(user.id, RegistrationState.OTP_VERIFIED),
      nextState: RegistrationState.OTP_VERIFIED,
    };
  }

  async acceptTerms(
    authorization: string | undefined,
    dto: AcceptTermsDto,
    context?: { ip?: string; userAgent?: string },
  ) {
    const claims = await this.verifyRegistrationToken(authorization, RegistrationState.OTP_VERIFIED);

    await this.prisma.user.update({
      where: { id: claims.sub },
      data: {
        registrationState: RegistrationState.TC_ACCEPTED,
      },
    });

    await this.logSecurityEvent(claims.sub, 'REGISTER_TERMS_ACCEPTED', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      metadata: { termsVersion: dto.termsVersion },
    });

    return {
      regToken: await this.signRegistrationToken(claims.sub, RegistrationState.TC_ACCEPTED),
      nextState: RegistrationState.TC_ACCEPTED,
    };
  }

  async registerProfile(
    authorization: string | undefined,
    dto: RegisterProfileDto,
    context?: { ip?: string; userAgent?: string },
  ) {
    const claims = await this.verifyRegistrationToken(authorization, [
      RegistrationState.TC_ACCEPTED,
      RegistrationState.KYC_VERIFIED,
    ]);

    await this.prisma.$transaction(async (tx) => {
      await tx.userProfile.upsert({
        where: { userId: claims.sub },
        update: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          address: dto.address,
          occupation: dto.occupation,
        },
        create: {
          userId: claims.sub,
          firstName: dto.firstName,
          lastName: dto.lastName,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          address: dto.address,
          occupation: dto.occupation,
        },
      });

      await tx.user.update({
        where: { id: claims.sub },
        data: { registrationState: RegistrationState.PROFILE_COMPLETED },
      });
    });

    await this.logSecurityEvent(claims.sub, 'REGISTER_PROFILE_COMPLETED', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return {
      regToken: await this.signRegistrationToken(claims.sub, RegistrationState.PROFILE_COMPLETED),
      nextState: RegistrationState.PROFILE_COMPLETED,
    };
  }

  async registerCredentials(
    authorization: string | undefined,
    dto: RegisterCredentialsDto,
    context?: { ip?: string; userAgent?: string },
  ) {
    const claims = await this.verifyRegistrationToken(
      authorization,
      RegistrationState.PROFILE_COMPLETED,
    );
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const pinHash = await bcrypt.hash(dto.pin, 10);

    await this.prisma.$transaction(async (tx) => {
      const device = await tx.userDevice.upsert({
        where: {
          userId_deviceIdentifier: {
            userId: claims.sub,
            deviceIdentifier: dto.deviceId,
          },
        },
        update: {
          deviceName: dto.deviceName,
          trustLevel: DeviceTrustLevel.TRUSTED,
          lastLoginAt: new Date(),
        },
        create: {
          userId: claims.sub,
          deviceIdentifier: dto.deviceId,
          deviceName: dto.deviceName,
          trustLevel: DeviceTrustLevel.TRUSTED,
          lastLoginAt: new Date(),
        },
      });

      await tx.userDevice.updateMany({
        where: {
          userId: claims.sub,
          id: { not: device.id },
          trustLevel: DeviceTrustLevel.TRUSTED,
        },
        data: { trustLevel: DeviceTrustLevel.UNTRUSTED },
      });

      await tx.user.update({
        where: { id: claims.sub },
        data: {
          passwordHash,
          pinHash,
          currentTrustedDeviceId: device.id,
          registrationState: RegistrationState.CREDENTIALS_SET,
        },
      });
    });

    await this.logSecurityEvent(claims.sub, 'REGISTER_CREDENTIALS_SET', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      deviceId: dto.deviceId,
    });

    return {
      regToken: await this.signRegistrationToken(claims.sub, RegistrationState.CREDENTIALS_SET),
      nextState: RegistrationState.CREDENTIALS_SET,
    };
  }

  async completeRegistration(
    authorization: string | undefined,
    context?: { ip?: string; userAgent?: string },
  ) {
    const claims = await this.verifyRegistrationToken(
      authorization,
      RegistrationState.CREDENTIALS_SET,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: claims.sub },
        data: {
          registrationState: RegistrationState.COMPLETED,
          status: UserStatus.ACTIVE,
        },
      });

      await tx.ledgerOutbox.upsert({
        where: {
          dedupeKey: `create-ledger-account:${claims.sub}`,
        },
        update: {},
        create: {
          aggregateId: claims.sub,
          eventType: 'CREATE_LEDGER_ACCOUNT',
          dedupeKey: `create-ledger-account:${claims.sub}`,
          payload: {
            userId: claims.sub,
            requestedAt: new Date().toISOString(),
          },
          status: 'PENDING',
        },
      });
    });

    const user = await this.prisma.user.findUnique({
      where: { id: claims.sub },
      include: {
        devices: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const trustedDevice =
      user.devices.find((device) => device.trustLevel === DeviceTrustLevel.TRUSTED) ??
      user.devices[0];
    if (!trustedDevice) {
      throw new ConflictException('No device found for completed registration');
    }

    await this.logSecurityEvent(claims.sub, 'REGISTER_COMPLETED', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      deviceId: trustedDevice.deviceIdentifier,
    });

    const tokenPair = await this.issueTokenPair({
      userId: user.id,
      deviceId: trustedDevice.id,
    });
    return tokenPair.response;
  }

  async login(dto: LoginDto, context?: { ip?: string; userAgent?: string }) {
    const identifier = dto.phoneNumber.trim();
    const user = await this.userService.findByIdentity(identifier);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    if (user.status === UserStatus.LOCKED || user.status === UserStatus.FROZEN) {
      throw new ForbiddenException('ACCOUNT_LOCKED');
    }
    if (user.status === UserStatus.CLOSED) {
      throw new ForbiddenException('ACCOUNT_CLOSED');
    }

    if (user.loginLockedUntil && user.loginLockedUntil > new Date()) {
      throw new ForbiddenException('ACCOUNT_LOCKED');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      await this.handleLoginFailure(user.id);
      await this.logSecurityEvent(user.id, 'LOGIN_FAILED', {
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
      });
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginFailCount: 0,
        loginLockedUntil: null,
      },
    });

    const existingDevice = await this.prisma.userDevice.findUnique({
      where: {
        userId_deviceIdentifier: {
          userId: user.id,
          deviceIdentifier: dto.deviceId,
        },
      },
    });

    const trustedDeviceCount = await this.prisma.userDevice.count({
      where: {
        userId: user.id,
        trustLevel: DeviceTrustLevel.TRUSTED,
      },
    });

    if (trustedDeviceCount === 0) {
      const bootstrapDevice = existingDevice
        ? await this.prisma.userDevice.update({
            where: { id: existingDevice.id },
            data: {
              trustLevel: DeviceTrustLevel.TRUSTED,
              deviceName: dto.deviceName ?? existingDevice.deviceName,
              lastLoginAt: new Date(),
            },
          })
        : await this.prisma.userDevice.create({
            data: {
              userId: user.id,
              deviceIdentifier: dto.deviceId,
              deviceName: dto.deviceName,
              trustLevel: DeviceTrustLevel.TRUSTED,
              lastLoginAt: new Date(),
            },
          });

      await this.prisma.user.update({
        where: { id: user.id },
        data: { currentTrustedDeviceId: bootstrapDevice.id },
      });

      const bootstrapTokenPair = await this.issueTokenPair({
        userId: user.id,
        deviceId: bootstrapDevice.id,
      });
      return bootstrapTokenPair.response;
    }

    if (!existingDevice || existingDevice.trustLevel !== DeviceTrustLevel.TRUSTED) {
      if (!user.phoneNumber) {
        throw new ForbiddenException({
          errorCode: 'NEW_DEVICE_OTP_REQUIRED',
          message: 'Phone number is not set for OTP challenge',
        });
      }

      if (!existingDevice) {
        await this.prisma.userDevice.create({
          data: {
            userId: user.id,
            deviceIdentifier: dto.deviceId,
            deviceName: dto.deviceName,
            trustLevel: DeviceTrustLevel.UNTRUSTED,
          },
        });
      }

      const challenge = await this.createOtpChallenge(
        user.id,
        user.phoneNumber,
        OtpPurpose.DEVICE_TRUST,
      );
      await this.logSecurityEvent(user.id, 'LOGIN_NEW_DEVICE_CHALLENGE', {
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        deviceId: dto.deviceId,
      });

      throw new ForbiddenException({
        errorCode: 'NEW_DEVICE_OTP_REQUIRED',
        challengeId: challenge.id,
        ...(this.isNonProduction() ? { debugOtp: challenge.plainOtp } : {}),
      });
    }

    await this.prisma.userDevice.update({
      where: { id: existingDevice.id },
      data: { lastLoginAt: new Date() },
    });

    await this.logSecurityEvent(user.id, 'LOGIN_SUCCESS', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      deviceId: dto.deviceId,
    });

    const tokenPair = await this.issueTokenPair({
      userId: user.id,
      deviceId: existingDevice.id,
    });
    return tokenPair.response;
  }

  async verifyDevice(dto: DeviceVerifyDto, context?: { ip?: string; userAgent?: string }) {
    const phoneNumber = this.normalizePhone(dto.phoneNumber);
    const user = await this.verifyOtpChallenge(
      dto.challengeId,
      phoneNumber,
      dto.otp,
      OtpPurpose.DEVICE_TRUST,
    );

    const tokenPair = await this.prisma.$transaction(async (tx) => {
      const device = await tx.userDevice.upsert({
        where: {
          userId_deviceIdentifier: {
            userId: user.id,
            deviceIdentifier: dto.deviceId,
          },
        },
        update: {
          deviceName: dto.deviceName,
          trustLevel: DeviceTrustLevel.TRUSTED,
          lastLoginAt: new Date(),
        },
        create: {
          userId: user.id,
          deviceIdentifier: dto.deviceId,
          deviceName: dto.deviceName,
          trustLevel: DeviceTrustLevel.TRUSTED,
          lastLoginAt: new Date(),
        },
      });

      await tx.userDevice.updateMany({
        where: {
          userId: user.id,
          id: { not: device.id },
          trustLevel: DeviceTrustLevel.TRUSTED,
        },
        data: {
          trustLevel: DeviceTrustLevel.UNTRUSTED,
        },
      });

      await tx.refreshSession.updateMany({
        where: {
          userId: user.id,
          status: SessionStatus.ACTIVE,
        },
        data: {
          status: SessionStatus.REVOKED,
          revokedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          currentTrustedDeviceId: device.id,
        },
      });

      const pair = await this.issueTokenPair(
        {
          userId: user.id,
          deviceId: device.id,
        },
        tx,
      );
      return pair.response;
    });

    await this.logSecurityEvent(user.id, 'DEVICE_VERIFIED', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      deviceId: dto.deviceId,
    });

    return tokenPair;
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(dto.refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('SESSION_REVOKED');
    }

    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('SESSION_REVOKED');
    }

    const session = await this.prisma.refreshSession.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });

    if (!session || session.status !== SessionStatus.ACTIVE || session.jti !== payload.jti) {
      throw new UnauthorizedException('SESSION_REVOKED');
    }

    if (session.expiresAt <= new Date()) {
      await this.prisma.refreshSession.update({
        where: { id: session.id },
        data: { status: SessionStatus.EXPIRED },
      });
      throw new UnauthorizedException('SESSION_REVOKED');
    }

    const matches = await bcrypt.compare(dto.refreshToken, session.refreshTokenHash);
    if (!matches) {
      await this.revokeAllSessions(session.userId);
      await this.logSecurityEvent(session.userId, 'TOKEN_REUSE_DETECTED');
      throw new UnauthorizedException('TOKEN_REUSE_DETECTED');
    }

    return this.prisma.$transaction(async (tx) => {
      const nextPair = await this.issueTokenPair(
        {
          userId: session.userId,
          deviceId: session.deviceId,
        },
        tx,
      );

      await tx.refreshSession.update({
        where: { id: session.id },
        data: {
          status: SessionStatus.ROTATED,
          revokedAt: new Date(),
          replacedByJti: nextPair.refreshJti,
        },
      });

      return nextPair.response;
    });
  }

  async logout(accessClaims: AccessTokenPayload) {
    await this.prisma.$transaction(async (tx) => {
      await tx.refreshSession.updateMany({
        where: {
          id: accessClaims.sid,
          userId: accessClaims.sub,
          status: SessionStatus.ACTIVE,
        },
        data: {
          status: SessionStatus.REVOKED,
          revokedAt: new Date(),
        },
      });

      if (accessClaims.exp) {
        await this.redis.set(
          `denylist:jti:${accessClaims.jti}`,
          'revoked',
          'EXAT',
          accessClaims.exp
        );
      }
    });
  }

  async logoutAll(userId: string, accessClaims?: AccessTokenPayload) {
    await this.revokeAllSessions(userId);

    if (accessClaims?.jti && accessClaims.exp) {
      await this.redis.set(
        `denylist:jti:${accessClaims.jti}`,
        'revoked',
        'EXAT',
        accessClaims.exp
      );
    }
  }

  async setupPin(userId: string, dto: PinSetupDto) {
    const pinHash = await bcrypt.hash(dto.pin, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        pinHash,
        pinAttempts: 0,
        pinLockedUntil: null,
      },
    });
  }

  async verifyPin(userId: string, dto: PinVerifyDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.pinHash) {
      throw new UnauthorizedException('PIN_NOT_SET');
    }

    if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
      throw new ForbiddenException('ACCOUNT_LOCKED');
    }

    const isValid = await bcrypt.compare(dto.pin, user.pinHash);
    if (!isValid) {
      await this.userService.handlePinFailure(userId);
      throw new UnauthorizedException('INVALID_PIN');
    }

    if (user.pinAttempts > 0 || user.pinLockedUntil) {
      await this.userService.resetPinAttempts(userId);
    }
  }

  async validatePinByUserId(userId: string, pin: string): Promise<boolean> {
    const user = await this.userService.findById(userId);
    if (!user || !user.pinHash) {
      return false;
    }
    return bcrypt.compare(pin, user.pinHash);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
      secret: this.accessSecret,
    });
    if (payload.typ !== 'access') {
      throw new UnauthorizedException('Invalid access token type');
    }
    return payload;
  }

  private async issueTokenPair(
    input: { userId: string; deviceId: string },
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prisma;

    const sessionId = randomUUID();
    const refreshJti = randomUUID();
    const accessJti = randomUUID();

    const accessPayload: AccessTokenPayload = {
      sub: input.userId,
      sid: sessionId,
      did: input.deviceId,
      typ: 'access',
      jti: accessJti,
      scope: 'wallet',
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: input.userId,
      sid: sessionId,
      did: input.deviceId,
      typ: 'refresh',
      jti: refreshJti,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.accessSecret,
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.refreshSecret,
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
      }),
    ]);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await prisma.refreshSession.create({
      data: {
        id: sessionId,
        userId: input.userId,
        deviceId: input.deviceId,
        jti: refreshJti,
        refreshTokenHash,
        status: SessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      },
    });

    return {
      refreshJti,
      response: {
        tokenType: 'Bearer',
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        accessToken,
        refreshToken,
        access_token: accessToken,
      },
    };
  }

  private async createOtpChallenge(userId: string, phoneNumber: string, purpose: OtpPurpose) {
    const plainOtp = this.generateOtp();
    const otpHash = await bcrypt.hash(plainOtp, 10);

    await this.prisma.otpChallenge.updateMany({
      where: {
        userId,
        purpose,
        status: OtpStatus.PENDING,
      },
      data: {
        status: OtpStatus.EXPIRED,
      },
    });

    const challenge = await this.prisma.otpChallenge.create({
      data: {
        userId,
        phoneNumber,
        purpose,
        otpHash,
        status: OtpStatus.PENDING,
        attempts: 0,
        maxAttempts: 5,
        expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
      },
    });

    // Send the OTP via the configured provider
    await this.smsProvider.sendMessage(
      phoneNumber,
      `Your J-Ledger verification code is: ${plainOtp}. Valid for 3 minutes.`,
    );

    return { id: challenge.id, plainOtp };
  }

  private async verifyOtpChallenge(
    challengeId: string,
    phoneNumber: string,
    otp: string,
    purpose: OtpPurpose,
  ) {
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: {
        id: challengeId,
        phoneNumber,
        purpose,
      },
      include: {
        user: true,
      },
    });

    if (!challenge || challenge.status !== OtpStatus.PENDING) {
      throw new UnauthorizedException('OTP_INVALID');
    }
    if (challenge.expiresAt <= new Date()) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { status: OtpStatus.EXPIRED },
      });
      throw new UnauthorizedException('OTP_EXPIRED');
    }
    if (challenge.attempts >= challenge.maxAttempts) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { status: OtpStatus.LOCKED },
      });
      throw new UnauthorizedException('OTP_RATE_LIMITED');
    }

    const valid = await bcrypt.compare(otp, challenge.otpHash);
    if (!valid) {
      const attempts = challenge.attempts + 1;
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: {
          attempts,
          status: attempts >= challenge.maxAttempts ? OtpStatus.LOCKED : OtpStatus.PENDING,
        },
      });
      throw new UnauthorizedException('OTP_INVALID');
    }

    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: {
        status: OtpStatus.VERIFIED,
        consumedAt: new Date(),
      },
    });

    return challenge.user;
  }

  public async signRegistrationToken(userId: string, state: RegistrationState): Promise<string> {
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

  public async verifyRegistrationToken(
    authorization: string | undefined,
    expectedState: RegistrationState | RegistrationState[],
  ) {
    const token = this.extractBearerToken(authorization);
    if (!token) {
      throw new UnauthorizedException('Registration token is required');
    }

    let payload: RegistrationTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RegistrationTokenPayload>(token, {
        secret: this.registrationSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid registration token');
    }

    if (payload.typ !== 'registration') {
      throw new UnauthorizedException('Invalid registration token type');
    }

    const acceptedStates = Array.isArray(expectedState) ? expectedState : [expectedState];
    if (!acceptedStates.includes(payload.state)) {
      throw new ForbiddenException('REGISTRATION_STATE_INVALID');
    }

    return payload;
  }

  private extractBearerToken(authorization: string | undefined): string | null {
    if (!authorization) {
      return null;
    }
    const [scheme, token] = authorization.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }
    return token.trim();
  }

  private generateOtp(): string {
    const value = Math.floor(Math.random() * 1_000_000);
    return String(value).padStart(6, '0');
  }

  private normalizePhone(phoneNumber: string) {
    return phoneNumber.trim();
  }

  private async handleLoginFailure(userId: string) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { loginFailCount: { increment: 1 } },
    });

    if (updated.loginFailCount >= MAX_LOGIN_ATTEMPTS) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          loginLockedUntil: new Date(Date.now() + LOGIN_LOCK_DURATION_MS),
        },
      });
    }
  }

  private async revokeAllSessions(userId: string) {
    await this.prisma.refreshSession.updateMany({
      where: {
        userId,
        status: SessionStatus.ACTIVE,
      },
      data: {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
      },
    });
  }

  private async logSecurityEvent(
    userId: string,
    eventType: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
      metadata?: Prisma.InputJsonValue;
    },
  ) {
    await this.prisma.securityLog.create({
      data: {
        userId,
        eventType,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        deviceId: options?.deviceId,
        metadata: options?.metadata,
      },
    });
  }

  private requireEnv(key: string) {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  private isNonProduction() {
    return this.configService.get<string>('NODE_ENV') !== 'production';
  }
}

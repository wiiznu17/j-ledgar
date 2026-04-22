import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  Inject,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConsentType,
  DeviceTrustLevel,
  KycVerificationStatus,
  OtpPurpose,
  OtpStatus,
  Prisma,
  RegistrationState,
  SessionStatus,
  UserStatus,
  UserDevice,
} from '@prisma/client-wallet';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { REDIS_CLIENT } from './auth.constants';
import Redis from 'ioredis';
import { ISmsProvider } from '../integrations/interfaces/sms-provider.interface';
import {
  AcceptTermsDto,
  BiometricVerifyDto,
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
  ip?: string;
  ua?: string;
}

interface RefreshTokenPayload {
  sub: string;
  sid: string;
  did: string;
  typ: 'refresh';
  jti: string;
  exp?: number;
  ip?: string;
  ua?: string;
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
    this.logger.log(`[Register] Initiating registration for ${phoneNumber}`);
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
    };
  }

  async registerVerifyOtp(
    dto: RegisterVerifyOtpDto,
    context?: { ip?: string; userAgent?: string },
  ) {
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
    const claims = await this.verifyRegistrationToken(
      authorization,
      RegistrationState.OTP_VERIFIED,
    );

    // Create consent records for PDPA compliance
    const consentsToCreate = [];

    // Terms and Conditions consent (required)
    consentsToCreate.push({
      userId: claims.sub,
      consentType: ConsentType.TERMS_AND_CONDITIONS,
      consentVersion: dto.termsVersion,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    // Privacy Policy consent (if provided)
    if (dto.privacyPolicyVersion) {
      consentsToCreate.push({
        userId: claims.sub,
        consentType: ConsentType.PRIVACY_POLICY,
        consentVersion: dto.privacyPolicyVersion,
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
      });
    }

    // Marketing consent (optional)
    if (dto.marketingConsent === true) {
      consentsToCreate.push({
        userId: claims.sub,
        consentType: ConsentType.MARKETING_COMMUNICATIONS,
        consentVersion: '1.0',
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
      });
    }

    // Biometric data processing consent (optional)
    if (dto.biometricConsent === true) {
      consentsToCreate.push({
        userId: claims.sub,
        consentType: ConsentType.BIOMETRIC_DATA_PROCESSING,
        consentVersion: '1.0',
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
      });
    }

    // Data processing consent (required for KYC)
    consentsToCreate.push({
      userId: claims.sub,
      consentType: ConsentType.DATA_PROCESSING,
      consentVersion: '1.0',
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    // Create all consent records
    await this.prisma.userConsent.createMany({
      data: consentsToCreate,
    });

    await this.prisma.user.update({
      where: { id: claims.sub },
      data: {
        registrationState: RegistrationState.TC_ACCEPTED,
      },
    });

    await this.logSecurityEvent(claims.sub, 'REGISTER_TERMS_ACCEPTED', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      metadata: {
        termsVersion: dto.termsVersion,
        consents: consentsToCreate.map((c) => c.consentType),
      },
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
          incomeRange: dto.incomeRange,
          sourceOfFunds: dto.sourceOfFunds,
          purposeOfAccount: dto.purposeOfAccount,
        },
        create: {
          userId: claims.sub,
          firstName: dto.firstName,
          lastName: dto.lastName,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          address: dto.address,
          occupation: dto.occupation,
          incomeRange: dto.incomeRange,
          sourceOfFunds: dto.sourceOfFunds,
          purposeOfAccount: dto.purposeOfAccount,
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

  async getRegistrationStatus(authorization: string | undefined) {
    const token = this.extractBearerToken(authorization);
    if (!token) throw new UnauthorizedException('Registration token is required');

    let payload: RegistrationTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RegistrationTokenPayload>(token, {
        secret: this.registrationSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid registration token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { profile: true, kycData: true },
    });

    if (!user) throw new UnauthorizedException('User not found');

    // Pre-fill data for mobile app
    const ocrData = user.kycData
      ? {
          firstName: user.kycData.idCardName?.split(' ')[0] || '',
          lastName: user.kycData.idCardName?.split(' ').slice(1).join(' ') || '',
        }
      : null;

    return {
      state: user.registrationState,
      phoneNumber: user.phoneNumber,
      ocrData,
      profile: user.profile
        ? {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            address: user.profile.address,
            occupation: user.profile.occupation,
            incomeRange: user.profile.incomeRange,
            sourceOfFunds: user.profile.sourceOfFunds,
            purposeOfAccount: user.profile.purposeOfAccount,
          }
        : null,
    };
  }

  async registerPassword(
    authorization: string | undefined,
    dto: RegisterPasswordDto,
    context?: { ip?: string; userAgent?: string },
  ) {
    const claims = await this.verifyRegistrationToken(
      authorization,
      RegistrationState.PROFILE_COMPLETED,
    );
    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id: claims.sub },
      data: {
        passwordHash,
        registrationState: RegistrationState.PASSWORD_SET,
      },
    });

    await this.logSecurityEvent(claims.sub, 'REGISTER_PASSWORD_SET', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return {
      regToken: await this.signRegistrationToken(claims.sub, RegistrationState.PASSWORD_SET),
      nextState: RegistrationState.PASSWORD_SET,
    };
  }

  async registerPin(
    authorization: string | undefined,
    dto: RegisterPinDto,
    context?: { ip?: string; userAgent?: string },
  ) {
    const claims = await this.verifyRegistrationToken(
      authorization,
      RegistrationState.PASSWORD_SET,
    );
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

      // Ensure only this device is trusted for now
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
          pinHash,
          currentTrustedDeviceId: device.id,
          registrationState: RegistrationState.CREDENTIALS_SET,
        },
      });
    });

    await this.logSecurityEvent(claims.sub, 'REGISTER_PIN_SET', {
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

    const user = await this.prisma.user.findUnique({
      where: { id: claims.sub },
      include: {
        kycData: true,
        profile: true,
        devices: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // DEEP VALIDATION (Requirement 1)
    if (!user.profile || !user.kycData || !user.passwordHash || !user.pinHash) {
      throw new BadRequestException('Incomplete registration data');
    }

    // MEDIA AVAILABILITY CHECK (Requirement 3)
    if (!user.kycData.idCardImageUrl || !user.kycData.selfieImageUrl) {
      // Rollback status to allow re-scanning if images are lost
      await this.prisma.user.update({
        where: { id: claims.sub },
        data: { registrationState: RegistrationState.OTP_VERIFIED },
      });
      throw new BadRequestException('KYC images missing. Please re-scan.');
    }

    const isKycApproved = user.kycData.verificationStatus === KycVerificationStatus.APPROVED;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: claims.sub },
        data: {
          registrationState: RegistrationState.COMPLETED,
          status: isKycApproved ? UserStatus.ACTIVE : UserStatus.PENDING,
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
            firstName: user.profile?.firstName,
            lastName: user.profile?.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            dateOfBirth: user.profile?.dateOfBirth?.toISOString(),
            requestedAt: new Date().toISOString(),
          },
          status: 'PENDING',
        },
      });
    });

    if (user.kycData.verificationStatus !== KycVerificationStatus.APPROVED) {
      return {
        registrationStatus: 'PENDING_APPROVAL',
        message:
          'Your registration is under review. You should get approval within 24 hour via SMS.',
      };
    }

    const trustedDevice =
      user.devices.find((device: UserDevice) => device.trustLevel === DeviceTrustLevel.TRUSTED) ??
      user.devices[0];
    if (!trustedDevice) {
      throw new ConflictException('No device found for completed registration');
    }

    await this.logSecurityEvent(claims.sub, 'REGISTER_COMPLETED', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      deviceId: trustedDevice.deviceIdentifier,
    });

    // Perform KYC risk assessment for BoT compliance
    await this.performKycRiskAssessment(claims.sub);

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
      this.logger.warn(`[Login] Entry not found or password missing for ${identifier}`);
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
      });
    }

    await this.prisma.userDevice.update({
      where: { id: existingDevice.id },
      data: { lastLoginAt: new Date() },
    });

    // Revoke all other sessions from different devices to enforce single-device session
    const revokedSessions = await this.prisma.refreshSession.updateMany({
      where: {
        userId: user.id,
        deviceId: { not: existingDevice.id },
        status: SessionStatus.ACTIVE,
      },
      data: {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    if (revokedSessions.count > 0) {
      await this.logSecurityEvent(user.id, 'LOGIN_SESSIONS_REVOKED', {
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        deviceId: dto.deviceId,
        metadata: { revokedCount: revokedSessions.count },
      });
    }

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
        undefined,
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
        undefined,
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
          accessClaims.exp,
        );
      }
    });
  }

  async logoutAll(userId: string, accessClaims?: AccessTokenPayload) {
    await this.revokeAllSessions(userId);

    if (accessClaims?.jti && accessClaims.exp) {
      await this.redis.set(`denylist:jti:${accessClaims.jti}`, 'revoked', 'EXAT', accessClaims.exp);
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

  async verifyBiometric(
    userId: string,
    dto: BiometricVerifyDto,
    context?: { ip?: string; userAgent?: string },
  ) {
    // Verify user exists and has PIN set (biometric is a shortcut for PIN)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.pinHash) {
      throw new UnauthorizedException('PIN_NOT_SET');
    }

    if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
      throw new ForbiddenException('ACCOUNT_LOCKED');
    }

    // Generate and store a biometric challenge in Redis
    const challengeKey = `biometric_challenge:${userId}:${dto.challenge}`;
    const storedChallenge = await this.redis.get(challengeKey);

    if (!storedChallenge) {
      throw new BadRequestException('Invalid or expired biometric challenge');
    }

    // Verify the challenge hasn't been used already (one-time use)
    await this.redis.del(challengeKey);

    // Log successful biometric authentication
    await this.logSecurityEvent(userId, 'BIOMETRIC_AUTH_SUCCESS', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      deviceId: dto.biometricType || 'BIOMETRIC',
    });

    // Reset PIN attempts on successful biometric auth
    if (user.pinAttempts > 0 || user.pinLockedUntil) {
      await this.userService.resetPinAttempts(userId);
    }

    return { success: true, message: 'Biometric verification successful' };
  }

  async generateBiometricChallenge(
    userId: string,
  ): Promise<{ challenge: string; expiresAt: number }> {
    const challenge = randomUUID();
    const challengeKey = `biometric_challenge:${userId}:${challenge}`;
    const expiresInSeconds = 300; // 5 minutes

    await this.redis.setex(challengeKey, expiresInSeconds, 'pending');

    return {
      challenge,
      expiresAt: Math.floor(Date.now() / 1000) + expiresInSeconds,
    };
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
    context?: { ip?: string; userAgent?: string },
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
      ip: context?.ip,
      ua: context?.userAgent,
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: input.userId,
      sid: sessionId,
      did: input.deviceId,
      typ: 'refresh',
      jti: refreshJti,
      ip: context?.ip,
      ua: context?.userAgent,
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
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
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

    this.logger.log(`[OTP] Created Challenge: ${challenge.id} for ${phoneNumber}`);

    return { id: challenge.id };
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

    const valid = await bcrypt.compare(otp.trim(), challenge.otpHash);
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

  async getUserConsents(userId: string) {
    const consents = await this.prisma.userConsent.findMany({
      where: { userId },
      orderBy: { consentedAt: 'desc' },
    });

    return consents.map((consent) => ({
      id: consent.id,
      consentType: consent.consentType,
      status: consent.status,
      consentVersion: consent.consentVersion,
      consentedAt: consent.consentedAt.toISOString(),
      withdrawnAt: consent.withdrawnAt?.toISOString(),
    }));
  }

  async withdrawConsent(
    userId: string,
    consentType: string,
    context?: { ip?: string; userAgent?: string },
  ) {
    // Validate consent type
    const validConsentTypes = ['MARKETING_COMMUNICATIONS', 'BIOMETRIC_DATA_PROCESSING'];

    if (!validConsentTypes.includes(consentType)) {
      throw new BadRequestException('This consent type cannot be withdrawn');
    }

    // Update consent status
    const consent = await this.prisma.userConsent.updateMany({
      where: {
        userId,
        consentType: consentType as any,
        status: 'ACTIVE',
      },
      data: {
        status: 'WITHDRAWN',
        withdrawnAt: new Date(),
      },
    });

    await this.logSecurityEvent(userId, 'CONSENT_WITHDRAWN', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      metadata: { consentType },
    });

    return { success: true };
  }

  async exportUserData(userId: string) {
    // Get user data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phoneNumber: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get profile data
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: {
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        address: true,
        occupation: true,
        incomeRange: true,
        sourceOfFunds: true,
        purposeOfAccount: true,
      },
    });

    // Get consents
    const consents = await this.getUserConsents(userId);

    // Get devices
    const devices = await this.prisma.userDevice.findMany({
      where: { userId },
      select: {
        id: true,
        deviceName: true,
        platform: true,
        trustLevel: true,
        lastLoginAt: true,
      },
    });

    return {
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
      },
      profile: profile ? profile : undefined,
      consents,
      devices: devices.map((d) => ({
        ...d,
        lastLoginAt: d.lastLoginAt?.toISOString(),
      })),
      exportedAt: new Date().toISOString(),
    };
  }

  async requestAccountDeletion(userId: string, context?: { ip?: string; userAgent?: string }) {
    // Check if user has active transactions or pending obligations
    const hasActiveTransactions = await this.prisma.transfer.findFirst({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
        status: 'PENDING',
      },
    });

    if (hasActiveTransactions) {
      throw new BadRequestException('Cannot delete account with pending transactions');
    }

    // Log deletion request
    await this.logSecurityEvent(userId, 'ACCOUNT_DELETION_REQUESTED', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    // In a full implementation, this would:
    // 1. Create a deletion request with a confirmation period
    // 2. Send confirmation email
    // 3. Allow user to cancel within the period
    // 4. Perform actual deletion after confirmation

    return {
      success: true,
      message: 'Account deletion request received. Please confirm via email.',
    };
  }

  async confirmAccountDeletion(userId: string, context?: { ip?: string; userAgent?: string }) {
    // Soft delete user account
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'CLOSED',
        phoneNumber: `deleted_${userId}_${Date.now()}`, // Anonymize
        email: null,
        passwordHash: null,
        pinHash: null,
      },
    });

    // Revoke all sessions
    await this.logoutAll(userId, { sub: userId } as any);

    // Log deletion
    await this.logSecurityEvent(userId, 'ACCOUNT_DELETED', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return { success: true };
  }

  async performKycRiskAssessment(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      throw new NotFoundException('User or profile not found');
    }

    // Risk assessment logic
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    const riskFactors: string[] = [];

    // Check income range (higher income = higher risk)
    if (user.profile.incomeRange === 'HIGH' || user.profile.incomeRange === 'VERY_HIGH') {
      riskLevel = 'MEDIUM';
      riskFactors.push('HIGH_INCOME');
    }

    // Check occupation (some occupations are higher risk)
    const highRiskOccupations = ['FINANCE', 'GAMBLING', 'CRYPTOCURRENCY'];
    if (highRiskOccupations.includes(user.profile.occupation || '')) {
      riskLevel = 'HIGH';
      riskFactors.push('HIGH_RISK_OCCUPATION');
    }

    // Check source of funds
    if (user.profile.sourceOfFunds === 'CRYPTOCURRENCY') {
      riskLevel = 'HIGH';
      riskFactors.push('CRYPTO_SOURCE');
    }

    // Determine review frequency based on risk level
    let nextReviewDate = new Date();
    if (riskLevel === 'LOW') {
      nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 3);
    } else if (riskLevel === 'MEDIUM') {
      nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 2);
    } else {
      nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1);
    }

    // Create KYC review record
    const kycReview = await this.prisma.kycReview.create({
      data: {
        userId,
        riskLevel,
        reviewStatus: 'APPROVED',
        reviewedAt: new Date(),
        nextReviewDate,
        notes: riskFactors.join(', ') || 'Standard KYC',
        pepScreened: false, // To be implemented with PEP screening service
        sanctionsScreened: false, // To be implemented with sanctions screening service
      },
    });

    return {
      riskLevel,
      nextReviewDate: nextReviewDate.toISOString(),
      riskFactors,
    };
  }

  async checkKycCompliance(userId: string) {
    const latestReview = await this.prisma.kycReview.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestReview) {
      throw new BadRequestException('KYC review not found');
    }

    // Check if review is expired
    if (latestReview.nextReviewDate && new Date() > latestReview.nextReviewDate) {
      return {
        compliant: false,
        reason: 'KYC_REVIEW_EXPIRED',
        nextReviewDate: latestReview.nextReviewDate.toISOString(),
      };
    }

    // Check if review is pending or rejected
    if (latestReview.reviewStatus !== 'APPROVED') {
      return {
        compliant: false,
        reason: 'KYC_NOT_APPROVED',
        reviewStatus: latestReview.reviewStatus,
      };
    }

    return {
      compliant: true,
      riskLevel: latestReview.riskLevel,
      nextReviewDate: latestReview.nextReviewDate?.toISOString(),
    };
  }

  async checkTransactionForSuspiciousActivity(
    userId: string,
    amount: number,
    recipientId?: string,
  ) {
    const suspiciousActivities: Array<{
      type: string;
      description: string;
      riskScore: number;
    }> = [];

    // Rule 1: Large transaction alert (> 100,000 THB)
    if (amount > 100000) {
      suspiciousActivities.push({
        type: 'LARGE_TRANSACTION',
        description: `Transaction amount ${amount} THB exceeds 100,000 THB threshold`,
        riskScore: 60,
      });
    }

    // Rule 2: High-frequency check (> 10 transactions in 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTransfers = await this.prisma.transfer.count({
      where: {
        fromUserId: userId,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentTransfers > 10) {
      suspiciousActivities.push({
        type: 'HIGH_FREQUENCY',
        description: `${recentTransfers} transactions in the last hour (potential smurfing)`,
        riskScore: 70,
      });
    }

    // Rule 3: Round number check (e.g., 50,000, 100,000)
    if (amount % 10000 === 0 && amount >= 50000) {
      suspiciousActivities.push({
        type: 'ROUND_NUMBER',
        description: `Round number transaction ${amount} THB (potential structuring)`,
        riskScore: 40,
      });
    }

    // Rule 4: Multiple recipients check (> 5 different recipients in 1 day)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const uniqueRecipients = await this.prisma.transfer.findMany({
      where: {
        fromUserId: userId,
        createdAt: { gte: oneDayAgo },
      },
      select: { toUserId: true },
      distinct: ['toUserId'],
    });

    if (uniqueRecipients.length > 5) {
      suspiciousActivities.push({
        type: 'MULTIPLE_RECIPIENTS',
        description: `${uniqueRecipients.length} different recipients in the last day`,
        riskScore: 50,
      });
    }

    // Create suspicious activity records if any detected
    if (suspiciousActivities.length > 0) {
      for (const activity of suspiciousActivities) {
        await this.prisma.suspiciousActivity.create({
          data: {
            userId,
            activityType: activity.type as any,
            amount,
            description: activity.description,
            riskScore: activity.riskScore,
            metadata: {
              recipientId,
              detectedAt: new Date().toISOString(),
            },
          },
        });
      }

      await this.logSecurityEvent(userId, 'SUSPICIOUS_ACTIVITY_DETECTED', {
        metadata: {
          amount,
          activities: suspiciousActivities.map((a) => a.type),
        },
      });
    }

    return {
      suspicious: suspiciousActivities.length > 0,
      activities: suspiciousActivities,
      requiresReview: suspiciousActivities.some((a) => a.riskScore >= 60),
    };
  }

  async getSuspiciousActivities(userId: string) {
    const activities = await this.prisma.suspiciousActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return activities.map((activity) => ({
      id: activity.id,
      type: activity.activityType,
      status: activity.status,
      amount: activity.amount,
      description: activity.description,
      riskScore: activity.riskScore,
      createdAt: activity.createdAt.toISOString(),
      reviewedAt: activity.reviewedAt?.toISOString(),
      amloReference: activity.amloReference,
    }));
  }

  async reportSuspiciousActivityToAmlo(activityId: string, reviewedBy: string) {
    const activity = await this.prisma.suspiciousActivity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Suspicious activity not found');
    }

    // In a full implementation, this would:
    // 1. Generate STR (Suspicious Transaction Report)
    // 2. Submit to AMLO API
    // 3. Get AMLO reference number
    // 4. Update activity status

    const amloReference = `STR-${Date.now()}-${activity.userId.substring(0, 8)}`;

    await this.prisma.suspiciousActivity.update({
      where: { id: activityId },
      data: {
        status: 'REPORTED_TO_AMLO',
        reviewedAt: new Date(),
        reviewedBy,
        reportedToAmloAt: new Date(),
        amloReference,
      },
    });

    return {
      success: true,
      amloReference,
    };
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
    } catch (error: unknown) {
      // Handle expired tokens specifically for better UX
      if (error && typeof error === 'object' && 'name' in error) {
        if (error.name === 'TokenExpiredError') {
          this.logger.warn(
            `[Registration] Expired token used for user: ${(error as any).payload?.sub || 'unknown'}`,
          );
          throw new UnauthorizedException(
            'Registration token has expired. Please restart the registration process.',
          );
        }
        if (error.name === 'JsonWebTokenError') {
          this.logger.warn(`[Registration] Invalid token: ${(error as any).message}`);
          throw new UnauthorizedException('Invalid registration token');
        }
      }
      throw new UnauthorizedException('Invalid registration token');
    }

    if (payload.typ !== 'registration') {
      throw new UnauthorizedException('Invalid registration token type');
    }

    const acceptedStates = Array.isArray(expectedState) ? expectedState : [expectedState];
    if (!acceptedStates.includes(payload.state)) {
      throw new ForbiddenException('REGISTRATION_STATE_INVALID');
    }

    // Additional explicit expiration check (defense-in-depth)
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      this.logger.warn(`[Registration] Token with expired exp claim: ${payload.sub}`);
      throw new UnauthorizedException('Registration token has expired');
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
}

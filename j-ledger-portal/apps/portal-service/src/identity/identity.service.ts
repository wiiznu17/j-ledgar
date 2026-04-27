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
import { REDIS_CLIENT } from '../common/constants';
import Redis from 'ioredis';
import { ISmsProvider } from '../integrations/interfaces/sms-provider.interface';
import { RegisterInitDto, RegisterVerifyOtpDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

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
  state: string;
  typ: 'registration';
  nonce: string;
  exp?: number;
}

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);
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
          status: 'ACTIVE',
          registrationState: 'PENDING',
        },
      });
    }

    if (user.registrationState === 'COMPLETED') {
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
      data: { registrationState: 'INITIATED' },
    });

    await this.logSecurityEvent(user.id, 'REGISTER_OTP_VERIFIED', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return {
      regToken: await this.signRegistrationToken(user.id, 'INITIATED'),
      nextState: 'INITIATED',
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

    if (user.status !== 'ACTIVE') {
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
        trustLevel: 'TRUSTED',
      },
      create: {
        userId: user.id,
        deviceIdentifier: dto.deviceId,
        deviceName: dto.deviceName,
        trustLevel: 'TRUSTED',
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
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(dto.refreshToken, {
        secret: this.refreshSecret,
      });

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

  private async signAccessToken(
    userId: string,
    sessionId: string,
    deviceId: string,
  ): Promise<string> {
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

  private async signRefreshToken(
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

  private async signRegistrationToken(userId: string, state: string): Promise<string> {
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

  // ==================== User Management ====================

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.trim() },
    });
  }

  async findByPhoneNumber(phoneNumber: string) {
    return this.prisma.user.findUnique({
      where: { phoneNumber: phoneNumber.trim() },
    });
  }

  async findByIdentity(identity: string) {
    const normalized = identity.trim();

    if (normalized.includes('@')) {
      return this.findByEmail(normalized);
    }

    return this.findByPhoneNumber(normalized);
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async getTrustedDeviceIdByIdentifier(userId: string, deviceIdentifier: string) {
    const device = await this.prisma.userDevice.findUnique({
      where: {
        userId_deviceIdentifier: {
          userId,
          deviceIdentifier,
        },
      },
    });

    if (!device || device.trustLevel !== 'TRUSTED') {
      return null;
    }

    return device.id;
  }

  async handlePinFailure(userId: string) {
    const MAX_PIN_ATTEMPTS = 3;
    const PIN_LOCK_DURATION_MS = 5 * 60 * 1000;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        pinAttempts: { increment: 1 },
      },
    });

    if (updated.pinAttempts >= MAX_PIN_ATTEMPTS) {
      return this.prisma.user.update({
        where: { id: userId },
        data: {
          pinLockedUntil: new Date(Date.now() + PIN_LOCK_DURATION_MS),
        },
      });
    }

    return updated;
  }

  async resetPinAttempts(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { pinAttempts: 0, pinLockedUntil: null },
    });
  }

  async findAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          phone: true,
          email: true,
          createdAt: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async searchUsers(query: string) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { phone: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        phone: true,
        email: true,
        createdAt: true,
        status: true,
      },
      take: 20,
    });
  }

  async updateUserStatus(id: string, status: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status },
    });
  }

  async blockUser(id: string, reason?: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status: 'BLOCKED' },
    });
  }

  async unblockUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async getUserActivity(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userDevices: {
          select: {
            deviceIdentifier: true,
            trustLevel: true,
            lastSeenAt: true,
            createdAt: true,
          },
          orderBy: { lastSeenAt: 'desc' },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      devices: user.userDevices,
      createdAt: user.createdAt,
      lastLoginAt: user.userDevices[0]?.lastSeenAt || null,
    };
  }

  // ==================== Placeholder Methods ====================

  async acceptTerms(authorization: string | undefined, dto: any, context?: any) {
    // TODO: Implement terms acceptance logic
    return { success: true };
  }

  async registerProfile(authorization: string | undefined, dto: any, context?: any) {
    // TODO: Implement profile registration logic
    return { success: true };
  }

  async registerPassword(authorization: string | undefined, dto: any, context?: any) {
    // TODO: Implement password registration logic
    return { success: true };
  }

  async registerPin(authorization: string | undefined, dto: any, context?: any) {
    // TODO: Implement PIN registration logic
    return { success: true };
  }

  async getRegistrationStatus(authorization: string | undefined) {
    // TODO: Implement registration status check
    return { state: 'PENDING' };
  }

  async completeRegistration(authorization: string | undefined, context?: any) {
    // TODO: Implement registration completion logic
    return { success: true };
  }

  async verifyDevice(dto: any, context?: any) {
    // TODO: Implement device verification logic
    return { success: true };
  }

  async setupPin(userId: string, dto: any) {
    // TODO: Implement PIN setup logic
    return { success: true };
  }

  async verifyPin(userId: string, dto: any) {
    // TODO: Implement PIN verification logic
    return;
  }

  async generateBiometricChallenge(userId: string) {
    // TODO: Implement biometric challenge generation
    return { challenge: randomUUID() };
  }

  async verifyBiometric(userId: string, dto: any, context?: any) {
    // TODO: Implement biometric verification logic
    return { success: true };
  }

  async getUserConsents(userId: string) {
    // TODO: Implement get user consents logic
    return [];
  }

  async withdrawConsent(userId: string, consentType: string, context?: any) {
    // TODO: Implement consent withdrawal logic
    return { success: true };
  }

  async exportUserData(userId: string) {
    // TODO: Implement data export logic
    return { exportedAt: new Date().toISOString() };
  }

  async requestAccountDeletion(userId: string, context?: any) {
    // TODO: Implement account deletion request logic
    return { success: true };
  }

  async confirmAccountDeletion(userId: string, context?: any) {
    // TODO: Implement account deletion confirmation logic
    return { success: true };
  }

  async getSuspiciousActivities(userId: string) {
    // TODO: Implement get suspicious activities logic
    return [];
  }

  async reportSuspiciousActivityToAmlo(activityId: string, userId: string) {
    // TODO: Implement AMLO reporting logic
    return { success: true };
  }
}

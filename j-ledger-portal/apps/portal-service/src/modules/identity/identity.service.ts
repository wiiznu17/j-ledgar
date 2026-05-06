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
import { PrismaService } from '../../core/prisma/prisma.service';
import { REDIS_CLIENT } from '../../core/common/constants';
import Redis from 'ioredis';
import { ISmsProvider } from '../integrations/interfaces/sms-provider.interface';
import { FinanceService } from '../integration/finance.service';
import { KafkaProducerService } from '../notification/kafka-producer.service';
import {
  RegisterInitDto,
  RegisterVerifyOtpDto,
  LoginDto,
  RefreshTokenDto,
  RegisterPasswordDto,
  RegisterPinDto,
  RegisterProfileDto,
  AcceptTermsDto,
} from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';
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
    private readonly kafkaProducer: KafkaProducerService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(ISmsProvider) private readonly smsProvider: ISmsProvider,
    private readonly financeService: FinanceService,
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

  private normalizePhone(phone: string): string {
    const digits = (phone || '').replace(/\D/g, '');
    // Convert to +66 format (E.164)
    if (digits.startsWith('66') && digits.length === 11) {
      return `+66${digits.slice(2)}`;
    }
    if (digits.startsWith('0') && digits.length === 10) {
      return `+66${digits.slice(1)}`;
    }
    if (digits.length === 9) {
      return `+66${digits}`;
    }
    // If already has + prefix, keep it
    if (phone.startsWith('+')) {
      return phone;
    }
    // Default: assume Thai number and add +66
    return `+66${digits}`;
  }

  private toE164Phone(localPhone: string): string {
    return this.normalizePhone(localPhone);
  }

  private getPhoneCandidates(phone: string): string[] {
    const e164 = this.normalizePhone(phone);
    const digits = e164.replace(/\D/g, '');
    // Generate variations for backward compatibility during search
    const local = `0${digits.slice(2)}`;
    return [...new Set([e164, local])];
  }

  // ==================== Registration ====================

  async registerInit(dto: RegisterInitDto, context?: { ip?: string; userAgent?: string }) {
    // Validate phone number format BEFORE normalization (Thai numbers must be 10 digits and start with 0)
    const inputDigits = (dto.phoneNumber || '').replace(/\D/g, '');
    if (inputDigits.length !== 10) {
      throw new BadRequestException('Phone number must be 10 digits');
    }
    if (!inputDigits.startsWith('0')) {
      throw new BadRequestException('Phone number must start with 0');
    }

    const phoneNumber = this.normalizePhone(dto.phoneNumber);
    this.logger.log(`[Register] STEP 1: Initiating registration for ${phoneNumber}`);

    let user = await this.prisma.user.findFirst({
      where: { phoneNumber: { in: this.getPhoneCandidates(phoneNumber) } },
    });

    if (!user) {
      this.logger.log(`[Register] Creating new user for ${phoneNumber}`);
      user = await this.prisma.user.create({
        data: {
          phoneNumber,
          registrationState: 'PENDING_OTP',
        },
      });
    } else {
      this.logger.log(
        `[Register] Existing user found for ${phoneNumber}, current state: ${user.registrationState}`,
      );
      // Reset registration state for fresh start
      if (user.registrationState !== 'COMPLETED') {
        this.logger.log(`[Register] Resetting registration state for ${phoneNumber}`);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { registrationState: 'PENDING_OTP' },
        });
        user.registrationState = 'PENDING_OTP';
      }
    }

    if (user.registrationState === 'COMPLETED') {
      this.logger.warn(`[Register] User ${phoneNumber} already registered`);
      throw new ConflictException('User already registered');
    }

    const challenge = await this.createOtpChallenge(user.id, phoneNumber);
    await this.logSecurityEvent(user.id, 'REGISTER_INIT_OTP', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    this.logger.log(
      `[Register] STEP 1 Complete: OTP challenge created for ${phoneNumber}, state: PENDING_OTP`,
    );

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
    this.logger.log(`[Register] STEP 2: Verifying OTP for ${phoneNumber}`);

    const user = await this.verifyOtpChallenge(dto.challengeId, phoneNumber, dto.otp);
    this.logger.log(
      `[Register] OTP verified for user ${user.id}, current state: ${user.registrationState}`,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { registrationState: 'OTP_VERIFIED' },
    });

    await this.logSecurityEvent(user.id, 'REGISTER_OTP_VERIFIED', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    this.logger.log(`[Register] STEP 2 Complete: State updated to OTP_VERIFIED for ${phoneNumber}`);

    return {
      regToken: await this.signRegistrationToken(user.id, 'OTP_VERIFIED'),
      nextState: 'OTP_VERIFIED',
    };
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

    const phoneNumber = this.normalizePhone(dto.phoneNumber);
    this.logger.log(`[Login] Attempting login for ${phoneNumber}`);

    const user = await this.prisma.user.findFirst({
      where: { phoneNumber: { in: this.getPhoneCandidates(phoneNumber) } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE' && user.status !== 'PENDING_APPROVAL') {
      throw new UnauthorizedException('Account is not active');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('Password not set');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
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
        ...(dto.pushToken && { pushToken: dto.pushToken }),
      },
      create: {
        userId: user.id,
        deviceIdentifier: dto.deviceId,
        deviceName: dto.deviceName,
        trustLevel: 'TRUSTED',
        lastSeenAt: new Date(),
        ...(dto.pushToken && { pushToken: dto.pushToken }),
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
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
        lastSeenAt: new Date(),
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
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        status: user.status,
        registrationState: user.registrationState,
      }
    };
  }

  // ==================== Refresh Token ====================

  async refresh(dto: RefreshTokenDto, context?: { ip?: string; userAgent?: string }) {
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
        }
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        user
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

    if (!this.getPhoneCandidates(phoneNumber).includes(challenge.phoneNumber)) {
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

    // Emit to Kafka for notification-worker
    await this.kafkaProducer.emit('security-events', {
      userId,
      eventType,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
      referenceId: new Date().getTime().toString(), // Using time as fallback reference
    });
  }

  // ==================== User Management ====================

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.trim() },
    });
  }

  async findByPhoneNumber(phoneNumber: string) {
    const normalized = this.normalizePhone(phoneNumber.trim());
    return this.prisma.user.findFirst({
      where: { phoneNumber: { in: this.getPhoneCandidates(normalized) } },
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

  async findAllUsers(
    page: number = 1,
    limit: number = 10,
    filters?: { email?: string; phone?: string; status?: string },
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.email) {
      where.email = { contains: filters.email, mode: 'insensitive' };
    }
    if (filters?.phone) {
      where.phoneNumber = { contains: filters.phone, mode: 'insensitive' };
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          phoneNumber: true,
          email: true,
          status: true,
          registrationState: true,
          ledgerAccountId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserStats() {
    const [total, active, pending, blocked] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'PENDING_APPROVAL' } }),
      this.prisma.user.count({ where: { status: 'BLOCKED' } }),
    ]);

    return {
      total,
      active,
      pending,
      blocked,
    };
  }

  async findAllSecurityEvents(page: number = 1, limit: number = 50, userId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (userId) where.userId = userId;

    const [events, total] = await Promise.all([
      this.prisma.securityEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              phoneNumber: true,
            },
          },
        },
      }),
      this.prisma.securityEvent.count({ where }),
    ]);

    return {
      data: events,
      pagination: {
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
          { phoneNumber: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        phoneNumber: true,
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
      data: { status: status as any },
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

  async acceptTerms(authorization: string | undefined, dto: AcceptTermsDto, context?: any) {
    if (!authorization) {
      throw new UnauthorizedException('Authorization header required');
    }

    const token = authorization.replace('Bearer ', '');
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.registrationSecret,
    });

    if (payload.typ !== 'registration') {
      throw new UnauthorizedException('Invalid token type');
    }

    this.logger.log(`[Register] STEP 3: Accepting terms for user ${payload.sub}`);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Save consent (upsert to handle re-acceptance)
    await this.prisma.userConsent.upsert({
      where: {
        userId_consentType: {
          userId: user.id,
          consentType: 'TERMS_OF_SERVICE',
        },
      },
      update: {
        acceptedAt: new Date(),
        withdrawnAt: null,
      },
      create: {
        userId: user.id,
        consentType: 'TERMS_OF_SERVICE',
        acceptedAt: new Date(),
      },
    });
    this.logger.log(`[Register] Consent saved for user ${user.id}`);

    // Update state
    await this.prisma.user.update({
      where: { id: user.id },
      data: { registrationState: 'TC_ACCEPTED' },
    });

    this.logger.log(`[Register] STEP 3 Complete: State updated to TC_ACCEPTED for user ${user.id}`);

    return { success: true };
  }

  async registerProfile(authorization: string | undefined, dto: RegisterProfileDto, context?: any) {
    if (!authorization) {
      throw new UnauthorizedException('Authorization header required');
    }

    const token = authorization.replace('Bearer ', '');
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.registrationSecret,
    });

    if (payload.typ !== 'registration') {
      throw new UnauthorizedException('Invalid token type');
    }

    this.logger.log(`[Register] STEP 4: Registering profile for user ${payload.sub}`);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Update user profile - save to userSettings for editable info
    // KYCData is now updated separately in KycService.confirmOcrData
    // Address is now saved in identity.addresses table via separate call or logic
    const sanitizedProfile = {
      occupation: dto.occupation,
      incomeRange: dto.incomeRange,
      sourceOfFunds: dto.sourceOfFunds,
      purposeOfAccount: dto.purposeOfAccount,
    };

    await this.prisma.userSetting.upsert({
      where: { userId_key: { userId: user.id, key: 'profile' } },
      create: {
        userId: user.id,
        key: 'profile',
        value: JSON.stringify(sanitizedProfile),
      },
      update: {
        value: JSON.stringify(sanitizedProfile),
      },
    });
    this.logger.log(`[Register] Profile (sanitized) saved for user ${user.id}`);

    // Update Address if provided
    if (dto.currentAddress) {
      await this.updateAddress(user.id, 'CURRENT', dto.currentAddress, 'MANUAL');
    }

    // Update state
    await this.prisma.user.update({
      where: { id: user.id },
      data: { registrationState: 'PROFILE_COMPLETED' },
    });

    this.logger.log(
      `[Register] STEP 4 Complete: State updated to PROFILE_COMPLETED for user ${user.id}`,
    );

    return { success: true };
  }

  async registerPassword(
    authorization: string | undefined,
    dto: RegisterPasswordDto,
    context?: any,
  ) {
    if (!authorization) {
      throw new UnauthorizedException('Authorization header required');
    }

    const token = authorization.replace('Bearer ', '');
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.registrationSecret,
    });

    if (payload.typ !== 'registration') {
      throw new UnauthorizedException('Invalid token type');
    }

    this.logger.log(`[Register] STEP 5: Setting password for user ${payload.sub}`);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, registrationState: 'PASSWORD_SET' },
    });
    this.logger.log(`[Register] Password saved for user ${user.id}`);

    await this.logSecurityEvent(user.id, 'PASSWORD_SET', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    this.logger.log(
      `[Register] STEP 5 Complete: State updated to PASSWORD_SET for user ${user.id}`,
    );

    return { success: true };
  }

  async registerPin(authorization: string | undefined, dto: RegisterPinDto, context?: any) {
    if (!authorization) {
      throw new UnauthorizedException('Authorization header required');
    }

    const token = authorization.replace('Bearer ', '');
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.registrationSecret,
    });

    if (payload.typ !== 'registration') {
      throw new UnauthorizedException('Invalid token type');
    }

    this.logger.log(`[Register] STEP 6: Setting PIN for user ${payload.sub}`);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const pinHash = await bcrypt.hash(dto.pin, 10);

    // Register device
    await this.prisma.userDevice.upsert({
      where: {
        userId_deviceIdentifier: {
          userId: user.id,
          deviceIdentifier: dto.deviceId,
        },
      },
      create: {
        userId: user.id,
        deviceIdentifier: dto.deviceId,
        deviceName: dto.deviceName,
        trustLevel: 'TRUSTED',
        ...(dto.pushToken && { pushToken: dto.pushToken }),
      },
      update: {
        deviceName: dto.deviceName,
        lastSeenAt: new Date(),
        ...(dto.pushToken && { pushToken: dto.pushToken }),
      },
    });
    this.logger.log(`[Register] Device registered for user ${user.id}`);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { pinHash, registrationState: 'CREDENTIALS_SET' },
    });
    this.logger.log(`[Register] PIN saved for user ${user.id}`);

    await this.logSecurityEvent(user.id, 'PIN_SETUP', {
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    this.logger.log(
      `[Register] STEP 6 Complete: State updated to CREDENTIALS_SET for user ${user.id}`,
    );

    return { success: true };
  }

  async getRegistrationStatus(authorization: string | undefined) {
    if (!authorization) {
      throw new UnauthorizedException('Authorization header required');
    }

    const token = authorization.replace('Bearer ', '');

    let payload;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.registrationSecret,
      });
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        this.logger.warn(`[Register] Token expired in getRegistrationStatus`);
        throw new UnauthorizedException('Token expired');
      }
      this.logger.warn(`[Register] Invalid token in getRegistrationStatus: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }

    this.logger.log(`[Register] Getting registration status for user ${payload.sub}`);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userSettings: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    this.logger.log(`[Register] Current state for user ${user.id}: ${user.registrationState}`);

    // Extract profile data from settings
    const profileSetting = user.userSettings.find((s) => s.key === 'profile');
    const profileData = profileSetting ? JSON.parse(profileSetting.value) : null;

    return {
      state: user.registrationState,
      prefilledData: profileData
        ? {
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            ...profileData,
          }
        : null,
    };
  }

  async completeRegistration(authorization: string | undefined, context?: any) {
    if (!authorization) {
      throw new UnauthorizedException('Authorization header required');
    }

    const token = authorization.replace('Bearer ', '');
    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.registrationSecret,
    });

    if (payload.typ !== 'registration') {
      throw new UnauthorizedException('Invalid token type');
    }

    this.logger.log(`[Register] STEP 7: Completing registration for user ${payload.sub}`);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.registrationState === 'COMPLETED') {
      throw new ConflictException('Registration already completed');
    }

    // Create wallet in finance service
    try {
      this.logger.log(`[Register] Creating wallet for user ${user.id}`);
      const wallet = await this.financeService.createWallet(user.id, 'THB');
      this.logger.log(`[Register] Wallet created for user ${user.id}: ${wallet.walletId}`);

      // Update user with wallet info
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          registrationState: 'COMPLETED',
          ledgerAccountId: wallet.walletId,
        },
      });

      await this.logSecurityEvent(user.id, 'REGISTRATION_COMPLETED', {
        walletId: wallet.walletId,
      });

      this.logger.log(
        `[Register] STEP 7 Complete: Registration completed for user ${user.id}, state: COMPLETED`,
      );

      return {
        success: true,
        walletId: wallet.walletId,
      };
    } catch (error) {
      this.logger.error(`Failed to create wallet for user ${user.id}`, error);
      throw new BadRequestException('Failed to create wallet');
    }
  }

  async verifyDevice(dto: any, context?: any) {
    // TODO: Implement device verification logic
    return { success: true };
  }

  async setupPin(userId: string, dto: any) {
    const pinHash = await bcrypt.hash(dto.pin, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { pinHash },
    });
    return { success: true };
  }

  async verifyPin(userId: string, dto: any) {
    this.logger.debug(`[Identity] Verifying PIN for user ${userId}`);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`[Identity] User not found for ID: ${userId}`);
      throw new BadRequestException('User not found');
    }

    if (!user.pinHash) {
      this.logger.warn(`[Identity] PIN not set for user: ${userId}`);
      throw new BadRequestException('PIN not set');
    }

    this.logger.debug(`[Identity] Comparing PIN for user ${userId}`);
    const isPinValid = await bcrypt.compare(dto.pin, user.pinHash);
    if (!isPinValid) {
      this.logger.warn(`[Identity] Invalid PIN attempt for user: ${userId}`);
      throw new UnauthorizedException('Invalid PIN');
    }

    // Reset pin attempts on success
    await this.prisma.user.update({
      where: { id: userId },
      data: { pinAttempts: 0, pinLockedUntil: null },
    });

    // Generate fresh tokens for the unlocked session
    const device = await this.prisma.userDevice.findFirst({
      where: { userId, deviceIdentifier: dto.deviceId },
    });

    return this.generateAuthResponse(user, device?.id);
  }

  private async generateAuthResponse(user: any, deviceId?: string, context?: any) {
    const sessionId = randomUUID();
    const accessToken = await this.signAccessToken(user.id, sessionId, deviceId);
    const refreshToken = await this.signRefreshToken(user.id, sessionId, deviceId);

    await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
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
      userId: user.id,
    };
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

  async getProfile(userId: string) {
    this.logger.log(`[Identity] Fetching profile for user ${userId}`);

    const [user, kycData, addresses] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userSettings: {
            where: { key: 'profile' },
          },
        },
      }),
      this.prisma.kYCData
        .findUnique({
          where: { userId },
        })
        .catch(() => null),
      this.prisma.address.findMany({
        where: { userId, deletedAt: null },
      }),
    ]);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const profileSetting = user.userSettings[0];
    let profileData: any = {};

    if (profileSetting) {
      try {
        profileData = JSON.parse(profileSetting.value);
        // Remove legacy address string if it exists in JSON
        if (profileData.address) {
          delete profileData.address;
        }
      } catch (e) {
        this.logger.error(`Failed to parse profile data for user ${userId}`, e);
      }
    }

    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      status: user.status,
      registrationState: user.registrationState,
      ledgerAccountId: user.ledgerAccountId,
      createdAt: user.createdAt,
      profile: profileData,
      addresses: addresses,
      kycData: kycData
        ? {
            firstNameTh: kycData.firstNameTh,
            lastNameTh: kycData.lastNameTh,
            firstNameEn: kycData.firstNameEn,
            lastNameEn: kycData.lastNameEn,
            idCardName: kycData.idCardName,
            dateOfBirth: kycData.dateOfBirth,
            verificationStatus: kycData.verificationStatus,
            verifiedAt: kycData.verifiedAt,
          }
        : null,
    };
  }

  async updateAddress(userId: string, type: any, dto: any, source?: any) {
    this.logger.log(`[Identity] Updating address ${type} for user ${userId}`);

    // Address History Pattern:
    // 1. Soft-delete current active address of this type
    // 2. Insert new record

    return await this.prisma.$transaction(async (tx) => {
      // Soft-delete existing active address of this type
      await tx.address.updateMany({
        where: {
          userId,
          type: type as any,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      // Create new address
      return tx.address.create({
        data: {
          userId,
          type: type as any,
          ...dto,
          verificationSource: source || undefined,
        },
      });
    });
  }

  async updateProfile(userId: string, profileData: any) {
    this.logger.log(`[Identity] Updating profile for user ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Ensure address is not being saved in generic profile setting anymore
    if (profileData.address) {
      delete profileData.address;
    }

    await this.prisma.userSetting.upsert({
      where: { userId_key: { userId: user.id, key: 'profile' } },
      create: {
        userId: user.id,
        key: 'profile',
        value: JSON.stringify(profileData),
      },
      update: {
        value: JSON.stringify(profileData),
      },
    });

    this.logger.log(`[Identity] Profile updated for user ${userId}`);

    return { success: true };
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

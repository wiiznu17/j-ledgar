import { SecurityEventType } from '@prisma/client';
import {
  Injectable,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma/prisma.service';
import { REDIS_CLIENT } from '../../core/common/constants';
import Redis from 'ioredis';
import { ISmsProvider } from '../integrations/interfaces/sms-provider.interface';
import { FinanceService } from '../../core/finance/finance.service';
import { KafkaProducerService } from '../notification/kafka-producer.service';
import {
  NotificationEventType,
  UserStatus,
  RegistrationState,
  KYCVerificationStatus,
  AddressType,
  AddressVerificationSource,
} from '@repo/dto';
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
import { IdentityUtils } from './utils/identity.utils';
import { UserAuthService } from './services/user-auth.service';
import { UserRegistrationService } from './services/user-registration.service';
import { UserProfileService } from './services/user-profile.service';
import { UserSecurityService } from './services/user-security.service';
import { UserAdminService } from './services/user-admin.service';

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly kafkaProducer: KafkaProducerService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(ISmsProvider) private readonly smsProvider: ISmsProvider,
    private readonly financeService: FinanceService,
    private readonly userAuthService: UserAuthService,
    private readonly userRegistrationService: UserRegistrationService,
    private readonly userProfileService: UserProfileService,
    private readonly userSecurityService: UserSecurityService,
    private readonly userAdminService: UserAdminService,
  ) {}

  // ==================== Phone Utils (Delegating to IdentityUtils) ====================

  private normalizePhone(phone: string): string {
    return IdentityUtils.normalizePhone(phone);
  }

  private toE164Phone(localPhone: string): string {
    return IdentityUtils.normalizePhone(localPhone);
  }

  private getPhoneCandidates(phone: string): string[] {
    return IdentityUtils.getPhoneCandidates(phone);
  }

  // ==================== Registration ====================

  async registerInit(dto: RegisterInitDto, context?: { ip?: string; userAgent?: string }) {
    return this.userRegistrationService.registerInit(dto, context);
  }

  async registerVerifyOtp(dto: RegisterVerifyOtpDto, context?: { ip?: string; userAgent?: string }) {
    return this.userRegistrationService.registerVerifyOtp(dto, context);
  }

  async acceptTerms(authorization: string | undefined, dto: AcceptTermsDto, context?: any) {
    return this.userRegistrationService.acceptTerms(authorization, dto, context);
  }

  async registerPassword(authorization: string | undefined, dto: RegisterPasswordDto, context?: any) {
    return this.userRegistrationService.registerPassword(authorization, dto, context);
  }

  async registerPin(authorization: string | undefined, dto: RegisterPinDto, context?: any) {
    return this.userRegistrationService.registerPin(authorization, dto, context);
  }

  async completeRegistration(authorization: string | undefined, context?: any) {
    return this.userRegistrationService.completeRegistration(authorization, context);
  }

  async getRegistrationStatus(authorization: string | undefined) {
    return this.userRegistrationService.getRegistrationStatus(authorization);
  }

  async validateRegistrationState(userId: string, allowedStates: string[]) {
    return this.userRegistrationService.validateRegistrationState(userId, allowedStates);
  }

  // ==================== Login & Auth ====================

  async login(dto: LoginDto, context?: { ip?: string; userAgent?: string }) {
    return this.userAuthService.login(dto, context);
  }

  async refresh(dto: RefreshTokenDto, context?: { ip?: string; userAgent?: string }) {
    return this.userAuthService.refresh(dto, context);
  }

  async logout(user: { sub: string; sid: string }) {
    return this.userAuthService.logout(user);
  }

  async logoutAll(userId: string, user: { sub: string }) {
    return this.userAuthService.logoutAll(userId, user);
  }

  // ==================== Security & Devices ====================

  async handlePinFailure(userId: string) {
    return this.userSecurityService.handlePinFailure(userId);
  }

  async resetPinAttempts(userId: string) {
    return this.userSecurityService.resetPinAttempts(userId);
  }

  async verifyDevice(dto: any, context?: any) {
    return this.userSecurityService.verifyDevice(dto, context);
  }

  async setupPin(userId: string, dto: any) {
    return this.userSecurityService.setupPin(userId, dto);
  }

  async verifyPin(userId: string, dto: any) {
    return this.userSecurityService.verifyPin(userId, dto);
  }

  async changePin(userId: string, dto: any) {
    return this.userSecurityService.changePin(userId, dto);
  }

  async resetPinRequest(userId: string) {
    return this.userSecurityService.resetPinRequest(userId);
  }

  async resetPin(userId: string, dto: any) {
    return this.userSecurityService.resetPin(userId, dto);
  }

  async generateBiometricChallenge(userId: string) {
    return this.userSecurityService.generateBiometricChallenge(userId);
  }

  async verifyBiometric(userId: string, dto: any, context?: any) {
    return this.userSecurityService.verifyBiometric(userId, dto, context);
  }

  async logSecurityEvent(userId: string, eventType: NotificationEventType, metadata?: any) {
    return this.userSecurityService.logSecurityEvent(userId, eventType, metadata);
  }

  async findAllUserDevices(page: number = 1, limit: number = 10, filters?: any) {
    return this.userSecurityService.findAllUserDevices(page, limit, filters);
  }

  async revokeUserDevice(deviceId: string) {
    return this.userSecurityService.revokeUserDevice(deviceId);
  }

  async createPayToken(userId: string) {
    return this.userSecurityService.createPayToken(userId);
  }

  async reactivateUserDevice(deviceId: string) {
    // This was not in the explicit list but belongs to Security
    const device = await this.prisma.userDevice.update({
      where: { id: deviceId },
      data: { trustLevel: 'TRUSTED' },
    });

    await this.logSecurityEvent(device.userId, NotificationEventType.LOGIN_SUCCESS, {
      action: 'DEVICE_REACTIVATED',
      deviceId,
    });

    return device;
  }

  // ==================== Profile & Addresses ====================

  async getProfile(userId: string) {
    return this.userProfileService.getProfile(userId);
  }

  async updateProfile(userId: string, profileData: any) {
    return this.userProfileService.updateProfile(userId, profileData);
  }

  async updateAddress(userId: string, type: any, dto: any, source?: any) {
    return this.userProfileService.updateAddress(userId, type, dto, source);
  }

  async requestEmailVerification(userId: string, email: string) {
    return this.userProfileService.requestEmailVerification(userId, email);
  }

  async confirmEmailVerification(userId: string, email: string, otp: string) {
    return this.userProfileService.confirmEmailVerification(userId, email, otp);
  }

  async getUserConsents(userId: string) {
    return this.userProfileService.getUserConsents(userId);
  }

  async withdrawConsent(userId: string, consentType: string, context?: any) {
    return this.userProfileService.withdrawConsent(userId, consentType, context);
  }

  async exportUserData(userId: string) {
    return this.userProfileService.exportUserData(userId);
  }

  // ==================== Admin ====================

  async findAllUsers(page: number = 1, limit: number = 10, filters?: any) {
    return this.userAdminService.findAllUsers(page, limit, filters);
  }

  async getUserStats() {
    return this.userAdminService.getUserStats();
  }

  async searchUsers(query: string) {
    return this.userAdminService.searchUsers(query);
  }

  async updateUserStatus(id: string, status: string) {
    return this.userAdminService.updateUserStatus(id, status);
  }

  async suspendUser(id: string) {
    return this.userAdminService.suspendUser(id);
  }

  async activateUser(id: string) {
    return this.userAdminService.activateUser(id);
  }

  async blockUser(id: string, reason?: string) {
    return this.userAdminService.blockUser(id, reason);
  }

  async getUserActivity(id: string) {
    return this.userAdminService.getUserActivity(id);
  }

  async getSuspiciousActivities(userId: string) {
    return this.userAdminService.getSuspiciousActivities(userId);
  }

  async reportSuspiciousActivityToAmlo(activityId: string, userId: string) {
    return this.userAdminService.reportSuspiciousActivityToAmlo(activityId, userId);
  }

  // ==================== User Management (Internal/Legacy) ====================

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.trim() },
    });
  }

  async findByPhoneNumber(phoneNumber: string) {
    const normalized = IdentityUtils.normalizePhone(phoneNumber.trim());
    return this.prisma.user.findFirst({
      where: { phoneNumber: { in: IdentityUtils.getPhoneCandidates(normalized) } },
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
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    const kyc = await this.prisma.kYCData.findUnique({
      where: { userId: id },
      select: { verificationStatus: true },
    });

    return {
      ...user,
      kycStatus: kyc?.verificationStatus || 'NOT_SUBMITTED',
    };
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

  async findAllSecurityEvents(page: number = 1, limit: number = 50, userId?: string, eventType?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (userId) where.userId = userId;
    if (eventType) where.eventType = eventType;

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

  async requestAccountDeletion(userId: string, context?: any) {
    await this.logSecurityEvent(userId, NotificationEventType.ACCOUNT_DELETION_REQUESTED, {
      ip: context?.ip,
    });
    return { success: true };
  }

  async confirmAccountDeletion(userId: string, context?: any) {
    await this.logSecurityEvent(userId, NotificationEventType.ACCOUNT_DELETED, {
      ip: context?.ip,
    });
    return { success: true };
  }

  // ==================== Special Case: registerProfile ====================
  // This method was not in the delegation list but it's a large block.
  // We keep it here as it coordinates multiple services for a specific onboarding step.
  async registerProfile(authorization: string | undefined, dto: RegisterProfileDto, context?: any) {
    if (!authorization) {
      throw new Error('Authorization header required');
    }

    // We'll keep the logic here but call sub-services where appropriate
    const token = authorization.replace('Bearer ', '');
    // Note: this still uses jwtService directly as it's a cross-cutting concern in this coordination method
    const registrationSecret = this.configService.get<string>('CUSTOMER_REGISTRATION_SECRET');
    const payload: any = await this.jwtService.verifyAsync(token, {
      secret: registrationSecret,
    });

    this.logger.log(`[Register] STEP 4: Registering profile for user ${payload.sub}`);

    await this.userRegistrationService.validateRegistrationState(payload.sub, [
      RegistrationState.KYC_VERIFIED,
      RegistrationState.PROFILE_COMPLETED,
    ]);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new Error('User not found');
    }

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

    if (dto.useIdentityAddress) {
      const registeredAddress = await this.prisma.address.findFirst({
        where: { userId: user.id, type: AddressType.REGISTERED },
      });

      if (registeredAddress) {
        await this.userProfileService.updateAddress(
          user.id,
          AddressType.CURRENT,
          {
            line1: registeredAddress.line1 || undefined,
            subdistrict: registeredAddress.subdistrict || undefined,
            district: registeredAddress.district || undefined,
            province: registeredAddress.province || undefined,
            postalCode: dto.currentAddress?.postalCode || registeredAddress.postalCode || undefined,
          },
          AddressVerificationSource.MANUAL,
        );
      } else if (dto.currentAddress) {
        await this.userProfileService.updateAddress(
          user.id,
          AddressType.CURRENT,
          dto.currentAddress,
          AddressVerificationSource.MANUAL,
        );
      }
    } else if (dto.currentAddress) {
      await this.userProfileService.updateAddress(
        user.id,
        AddressType.CURRENT,
        dto.currentAddress,
        AddressVerificationSource.MANUAL,
      );
    }

    let nextState: RegistrationState = RegistrationState.PROFILE_COMPLETED;
    if (user.passwordHash && user.pinHash) {
      nextState = RegistrationState.COMPLETED;
    }

    const updatedStatus =
      (user.status as UserStatus) === UserStatus.INACTIVE || (user.status as UserStatus) === UserStatus.REJECTED
        ? UserStatus.PENDING_APPROVAL
        : (user.status as UserStatus);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        registrationState: nextState,
        status: updatedStatus as UserStatus,
      },
    });

    if (updatedStatus === UserStatus.PENDING_APPROVAL) {
      await this.prisma.kYCData.updateMany({
        where: { userId: user.id },
        data: { verificationStatus: KYCVerificationStatus.PENDING },
      });
    }

    await this.logSecurityEvent(user.id, NotificationEventType.KYC_SUBMITTED, {
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      nextState,
    };
  }
}

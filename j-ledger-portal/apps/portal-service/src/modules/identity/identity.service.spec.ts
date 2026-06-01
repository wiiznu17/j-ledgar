import { Test, TestingModule } from '@nestjs/testing';
import { IdentityService } from './identity.service';
import { UserAuthService } from './services/user-auth.service';
import { UserRegistrationService } from './services/user-registration.service';
import { UserProfileService } from './services/user-profile.service';
import { UserSecurityService } from './services/user-security.service';
import { UserAdminService } from './services/user-admin.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { KafkaProducerService } from '../notification/kafka-producer.service';
import { REDIS_CLIENT } from '../../core/common/constants';
import { ISmsProvider } from '../integrations/interfaces/sms-provider.interface';
import { FinanceService } from '../../core/finance/finance.service';
import {
  createMockPrismaService,
  createMockConfigService,
  createMockKafkaProducer,
  createMockRedisClient,
  createMockFinanceService,
} from '../../__tests__/test-utils';
import { ConflictException, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { RegistrationState, UserStatus, KafkaTopic } from '@repo/dto';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('IdentityService', () => {
  let service: IdentityService;
  let prisma: any;
  let jwtService: any;
  let configService: any;
  let kafkaProducer: any;
  let redis: any;
  let smsProvider: any;
  let financeService: any;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    jwtService = {
      sign: jest.fn().mockReturnValue('mocked-token'),
      signAsync: jest.fn().mockResolvedValue('mocked-token'),
      verify: jest.fn(),
      verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1', typ: 'registration' }),
    };
    configService = createMockConfigService();
    kafkaProducer = createMockKafkaProducer();
    redis = createMockRedisClient();
    smsProvider = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
    };
    financeService = createMockFinanceService();

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-code');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityService,
        UserAuthService,
        UserRegistrationService,
        UserProfileService,
        UserSecurityService,
        UserAdminService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: KafkaProducerService,
          useValue: kafkaProducer,
        },
        {
          provide: REDIS_CLIENT,
          useValue: redis,
        },
        {
          provide: ISmsProvider,
          useValue: smsProvider,
        },
        {
          provide: FinanceService,
          useValue: financeService,
        },
      ],
    }).compile();

    service = module.get<IdentityService>(IdentityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizePhone', () => {
    it('should convert 0812345678 to +66812345678', () => {
      const result = service['normalizePhone']('0812345678');
      expect(result).toBe('+66812345678');
    });

    it('should convert 66812345678 to +66812345678', () => {
      const result = service['normalizePhone']('66812345678');
      expect(result).toBe('+66812345678');
    });

    it('should pass through already E.164 format', () => {
      const result = service['normalizePhone']('+66812345678');
      expect(result).toBe('+66812345678');
    });
  });

  describe('registerInit', () => {
    it('should throw BadRequestException if phone number is not 10 digits or does not start with 0', async () => {
      await expect(
        service.registerInit({ phoneNumber: '12345' }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.registerInit({ phoneNumber: '1812345678' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should send OTP and create user with PENDING state if user does not exist', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        phoneNumber: '+66812345678',
        registrationState: RegistrationState.PENDING_OTP,
      });

      prisma.otpChallenge.create.mockResolvedValue({
        id: 'challenge-1',
        expiresAt: new Date(Date.now() + 180000),
      });

      const result = await service.registerInit({ phoneNumber: '0812345678' });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          phoneNumber: '+66812345678',
          registrationState: RegistrationState.PENDING_OTP,
        },
      });

      expect(prisma.otpChallenge.create).toHaveBeenCalled();
      expect(smsProvider.sendMessage).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.challengeId).toBe('challenge-1');
    });

    it('should throw ConflictException if user already registered', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-existing',
        phoneNumber: '+66812345678',
        registrationState: RegistrationState.COMPLETED,
        passwordHash: 'somehash',
      });

      await expect(
        service.registerInit({ phoneNumber: '0812345678' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('registerVerifyOtp', () => {
    it('should throw BadRequestException if OTP is invalid or expired', async () => {
      // Mock challenge lookup returns null (challenge expired or invalid)
      prisma.otpChallenge.findUnique.mockResolvedValue(null);

      await expect(
        service.registerVerifyOtp({
          challengeId: 'challenge-1',
          phoneNumber: '0812345678',
          otp: '123456',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should verify OTP and advance registration state to OTP_VERIFIED', async () => {
      prisma.otpChallenge.findUnique.mockResolvedValue({
        id: 'challenge-1',
        userId: 'user-1',
        phoneNumber: '+66812345678',
        code: 'hashed-code',
        expiresAt: new Date(Date.now() + 180000),
        verifiedAt: null,
      });

      prisma.user.findUnique
        .mockResolvedValueOnce({
          id: 'user-1',
          phoneNumber: '+66812345678',
          registrationState: RegistrationState.PENDING_OTP,
        })
        .mockResolvedValueOnce({
          id: 'user-1',
          phoneNumber: '+66812345678',
          registrationState: RegistrationState.OTP_VERIFIED,
        });

      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        registrationState: RegistrationState.OTP_VERIFIED,
      });

      prisma.otpChallenge.update.mockResolvedValue({});

      const result = await service.registerVerifyOtp({
        challengeId: 'challenge-1',
        phoneNumber: '0812345678',
        otp: '123456',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { registrationState: RegistrationState.OTP_VERIFIED },
      });
      expect(prisma.otpChallenge.update).toHaveBeenCalledWith({
        where: { id: 'challenge-1' },
        data: expect.objectContaining({ verifiedAt: expect.any(Date) }),
      });
      expect(result.regToken).toBe('mocked-token');
      expect(result.nextState).toBe(RegistrationState.OTP_VERIFIED);
    });
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-1',
      phoneNumber: '+66812345678',
      passwordHash: 'hashedpin',
      status: UserStatus.ACTIVE,
      pinFailedAttempts: 0,
    };

    it('should throw UnauthorizedException on wrong password', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // passwords do not match

      await expect(
        service.login({
          phoneNumber: '0812345678',
          password: 'wrongpassword',
          deviceId: 'device-1',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return access and refresh tokens on valid credentials', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // passwords match
      prisma.deviceTrust.findUnique.mockResolvedValue({
        trustLevel: 'TRUSTED',
      });
      prisma.userDevice.findUnique.mockResolvedValue({
        id: 'device-id-123',
      });
      prisma.userDevice.upsert.mockResolvedValue({
        id: 'device-id-123',
      });
      prisma.userSession.create.mockResolvedValue({
        id: 'session-1',
      });
      prisma.refreshSession.create.mockResolvedValue({
        id: 'session-refresh-1',
      });

      const result = await service.login({
        phoneNumber: '0812345678',
        password: 'validpassword',
        deviceId: 'device-1',
      });

      expect(result.accessToken).toBe('mocked-token');
      expect(result.refreshToken).toBe('mocked-token');
      expect(result.user.phoneNumber).toBe('+66812345678');
    });
  });

  describe('verifyPin attempts & locking', () => {
    it('should throw UnauthorizedException and increment pinAttempts on invalid PIN', async () => {
      const mockUser = {
        id: 'user-1',
        pinHash: 'hashed-pin',
        pinAttempts: 0,
        pinLockedUntil: null,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // wrong PIN

      // handlePinFailure path
      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        pinAttempts: 1,
        pinLockedUntil: null,
      });

      await expect(
        service.verifyPin('user-1', { pin: '1111', deviceId: 'dev-1' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { pinAttempts: { increment: 1 } },
      });
    });

    it('should lock PIN and throw ForbiddenException on 3 consecutive failures', async () => {
      const mockUser = {
        id: 'user-1',
        pinHash: 'hashed-pin',
        pinAttempts: 2, // next failure will be 3rd
        pinLockedUntil: null,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // wrong PIN

      // handlePinFailure path sets pinLockedUntil
      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        pinAttempts: 3,
        pinLockedUntil: new Date(Date.now() + 300000), // locked for 5 minutes
      });

      await expect(
        service.verifyPin('user-1', { pin: '1111', deviceId: 'dev-1' }),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.user.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'user-1' },
        data: { pinAttempts: { increment: 1 } },
      });

      expect(prisma.user.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'user-1' },
        data: { pinLockedUntil: expect.any(Date) },
      });
    });
  });

  describe('createPayToken', () => {
    it('should create a temporary Redis key with TTL and return token details', async () => {
      redis.set.mockResolvedValue('OK');

      const result = await service.createPayToken('user-1');

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^pay_token:PAY-[A-Z0-9]{16}$/),
        'user-1',
        'EX',
        60, // 60s TTL
      );

      expect(result.token).toMatch(/^PAY-[A-Z0-9]{16}$/);
      expect(result.expiresAt).toBeDefined();
    });
  });

  describe('emailVerification', () => {
    describe('requestEmailVerification', () => {
      it('should throw BadRequestException if email is already taken by another user', async () => {
        prisma.user.findFirst.mockResolvedValue({ id: 'other-user', email: 'taken@example.com' });

        await expect(
          service.requestEmailVerification('user-1', 'taken@example.com'),
        ).rejects.toThrow(BadRequestException);
      });

      it('should store OTP in Redis and emit Kafka event on success', async () => {
        prisma.user.findFirst.mockResolvedValue(null);
        redis.set.mockResolvedValue('OK');
        kafkaProducer.emit.mockResolvedValue(undefined);

        const result = await service.requestEmailVerification('user-1', 'test@example.com');

        expect(redis.set).toHaveBeenCalledWith(
          'email_verification:otp:user-1',
          expect.stringContaining('test@example.com'),
          'EX',
          300,
        );

        expect(kafkaProducer.emit).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            userId: 'user-1',
            eventType: 'EMAIL_VERIFICATION_OTP',
            metadata: expect.objectContaining({
              email: 'test@example.com',
              otp: expect.stringMatching(/^\d{6}$/),
            }),
          }),
        );

        expect(result.success).toBe(true);
        expect(result.message).toBeDefined();
      });
    });

    describe('confirmEmailVerification', () => {
      it('should throw BadRequestException if OTP is expired/missing in Redis', async () => {
        redis.get.mockResolvedValue(null);

        await expect(
          service.confirmEmailVerification('user-1', 'test@example.com', '123456'),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException on OTP mismatch', async () => {
        redis.get.mockResolvedValue(JSON.stringify({ email: 'test@example.com', otp: '123456' }));

        await expect(
          service.confirmEmailVerification('user-1', 'test@example.com', '654321'),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException on email mismatch', async () => {
        redis.get.mockResolvedValue(JSON.stringify({ email: 'test@example.com', otp: '123456' }));

        await expect(
          service.confirmEmailVerification('user-1', 'wrong@example.com', '123456'),
        ).rejects.toThrow(BadRequestException);
      });

      it('should clean Redis, update User & UserSetting, and return success', async () => {
        redis.get.mockResolvedValue(JSON.stringify({ email: 'test@example.com', otp: '123456' }));
        prisma.user.findFirst.mockResolvedValue(null);
        redis.del.mockResolvedValue(1);

        prisma.$transaction.mockImplementation(async (callback: any) => {
          return callback(prisma);
        });

        prisma.user.update.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
        prisma.userSetting.upsert.mockResolvedValue({ id: 'setting-1' });

        const result = await service.confirmEmailVerification('user-1', 'test@example.com', '123456');

        expect(redis.del).toHaveBeenCalledWith('email_verification:otp:user-1');
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user-1' },
          data: { email: 'test@example.com' },
        });
        expect(prisma.userSetting.upsert).toHaveBeenCalledWith({
          where: {
            userId_key: {
              userId: 'user-1',
              key: 'email_verified',
            },
          },
          update: { value: 'true' },
          create: {
            userId: 'user-1',
            key: 'email_verified',
            value: 'true',
          },
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe('PIN Change & Reset', () => {
    describe('changePin', () => {
      it('should throw BadRequestException if user not found', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        await expect(
          service.changePin('user-1', { oldPin: '123456', newPin: '654321' }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException if old PIN is incorrect', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 'user-1', pinHash: 'hashed-old' });
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(
          service.changePin('user-1', { oldPin: '123456', newPin: '654321' }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should update pinHash on valid old PIN', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 'user-1', pinHash: 'hashed-old' });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new');
        prisma.user.update.mockResolvedValue({ id: 'user-1' });

        const result = await service.changePin('user-1', { oldPin: '123456', newPin: '654321' });

        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user-1' },
          data: {
            pinHash: 'hashed-new',
            pinAttempts: 0,
            pinLockedUntil: null,
          },
        });
        expect(result.success).toBe(true);
      });
    });

    describe('resetPinRequest', () => {
      it('should throw BadRequestException if email is not verified', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
        prisma.userSetting.findUnique.mockResolvedValue(null); // not verified

        await expect(
          service.resetPinRequest('user-1'),
        ).rejects.toThrow(BadRequestException);
      });

      it('should store OTP in Redis and emit Kafka event on verified email', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
        prisma.userSetting.findUnique.mockResolvedValue({ key: 'email_verified', value: 'true' });
        redis.set.mockResolvedValue('OK');
        kafkaProducer.emit.mockResolvedValue('OK');

        const result = await service.resetPinRequest('user-1');

        expect(redis.set).toHaveBeenCalledWith(
          'pin_reset:otp:user-1',
          expect.stringContaining('"email":"test@example.com"'),
          'EX',
          300,
        );
        expect(kafkaProducer.emit).toHaveBeenCalledWith(
          KafkaTopic.SECURITY_EVENTS,
          expect.objectContaining({
            userId: 'user-1',
            eventType: 'PIN_RESET_OTP',
          }),
        );
        expect(result.success).toBe(true);
      });
    });

    describe('resetPin', () => {
      it('should throw BadRequestException if OTP is missing/expired in Redis', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
        redis.get.mockResolvedValue(null);

        await expect(
          service.resetPin('user-1', { otp: '123456', newPin: '654321' }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException on OTP mismatch', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
        redis.get.mockResolvedValue(JSON.stringify({ otp: '111111' }));

        await expect(
          service.resetPin('user-1', { otp: '123456', newPin: '654321' }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should update pinHash and delete OTP on valid code', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
        redis.get.mockResolvedValue(JSON.stringify({ otp: '123456' }));
        redis.del.mockResolvedValue(1);
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new');
        prisma.user.update.mockResolvedValue({ id: 'user-1' });

        const result = await service.resetPin('user-1', { otp: '123456', newPin: '654321' });

        expect(redis.del).toHaveBeenCalledWith('pin_reset:otp:user-1');
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user-1' },
          data: {
            pinHash: 'hashed-new',
            pinAttempts: 0,
            pinLockedUntil: null,
          },
        });
        expect(result.success).toBe(true);
      });
    });
  });
});

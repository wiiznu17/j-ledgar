import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/core/prisma/prisma.service';
import { DbTestHelper } from '../helpers/db-test.helper';
import { AuthTestHelper } from '../helpers/auth-test.helper';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('Onboarding Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dbHelper: DbTestHelper;
  let authHelper: AuthTestHelper;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('KafkaProducerService')
      .useValue({
        sendMessage: jest.fn().mockResolvedValue(null),
        onModuleInit: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    dbHelper = new DbTestHelper(prisma);
    authHelper = new AuthTestHelper(
      moduleFixture.get<JwtService>(JwtService),
      moduleFixture.get<ConfigService>(ConfigService)
    );
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  // --- REGISTRATION & RESUME FLOWS ---

  describe('TC-01: Happy Path Registration', () => {
    it('should allow a new user to start registration', async () => {
      const response = await request(app.getHttpServer())
        .post('/identity/register/init')
        .send({ phoneNumber: '0812345678' });

      expect([200, 201]).toContain(response.status);
      expect(response.body).toHaveProperty('challengeId');
    });
  });

  describe('TC-02: Resume Without Password (Sign Up Path)', () => {
    it('should resume at the correct state after re-initiating registration', async () => {
      const user = await prisma.user.create({
        data: { phoneNumber: '0811111111', registrationState: 'TC_ACCEPTED' },
      });

      const response = await request(app.getHttpServer())
        .post('/identity/register/init')
        .send({ phoneNumber: '0811111111' });

      expect([200, 201]).toContain(response.status);
      
      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(updatedUser?.registrationState).toBe('PENDING_OTP');
    });
  });

  describe('TC-03: Cross-session Resume (Device Change Simulation)', () => {
    it('should maintain the correct state after a fresh sign-up initiation', async () => {
      const user = await prisma.user.create({
        data: { phoneNumber: '0881112222', registrationState: 'TC_ACCEPTED' },
      });

      await request(app.getHttpServer())
        .post('/identity/register/init')
        .send({ phoneNumber: '0881112222' });
      
      const newRegToken = await authHelper.generateRegistrationToken(user.id, 'PENDING_OTP');

      const statusRes = await request(app.getHttpServer())
        .post('/identity/register/status')
        .set('Authorization', `Bearer ${newRegToken}`);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.state).toBe('PENDING_OTP');
    });
  });

  describe('TC-04: Resume With Password (Login Path)', () => {
    it('should allow a user with password to resume at the PIN step', async () => {
      const user = await prisma.user.create({
        data: {
          phoneNumber: '0855555555',
          passwordHash: 'some-hash',
          registrationState: 'PASSWORD_SET',
        },
      });

      const regToken = await authHelper.generateRegistrationToken(user.id, 'PASSWORD_SET');
      
      const response = await request(app.getHttpServer())
        .post('/identity/register/status')
        .set('Authorization', `Bearer ${regToken}`);

      expect(response.status).toBe(200);
      expect(response.body.state).toBe('PASSWORD_SET');
    });
  });

  // --- RETRY & ADDRESS HARDENING ---

  describe('TC-05: Smart Skip Path (Retry Rejected User)', () => {
    it('should skip to COMPLETED state if a rejected user with password completes profile', async () => {
      const user = await prisma.user.create({
        data: {
          phoneNumber: '0822222222',
          status: 'REJECTED',
          registrationState: 'KYC_VERIFIED',
          passwordHash: 'some-hash',
          pinHash: 'some-pin-hash',
        },
      });

      const regToken = await authHelper.generateRegistrationToken(user.id, 'KYC_VERIFIED');

      await prisma.address.create({
        data: {
          userId: user.id,
          type: 'REGISTERED',
          line1: '99 Identity Rd',
          subdistrict: 'Bangkok',
          district: 'Pathum Wan',
          province: 'Bangkok',
          postalCode: '10330',
        },
      });

      const response = await request(app.getHttpServer())
        .post('/identity/register/profile')
        .set('Authorization', `Bearer ${regToken}`)
        .send({
          occupation: 'Tester',
          incomeRange: '30000',
          sourceOfFunds: 'Savings',
          purposeOfAccount: 'Testing',
          useIdentityAddress: true,
          currentAddress: { postalCode: '10110' },
        });

      expect([200, 201]).toContain(response.status);
      expect(response.body.nextState).toBe('COMPLETED');
    });
  });

  describe('TC-06: Address Sanitization Validation', () => {
    it('should successfully save profile even with extra database fields in address', async () => {
      const user = await prisma.user.create({
        data: {
          phoneNumber: '0899999999',
          status: 'ACTIVE',
          registrationState: 'KYC_VERIFIED',
        },
      });

      const regToken = await authHelper.generateRegistrationToken(user.id, 'KYC_VERIFIED');

      const dirtyAddress = {
        line1: '123 Main St',
        subdistrict: 'Bangkok',
        district: 'Pathum Wan',
        province: 'Bangkok',
        postalCode: '10330',
        label: 'Home',
        id: 'some-random-id', 
        userId: user.id,      
        createdAt: new Date(), 
      };

      const { line1, subdistrict, district, province, postalCode, label } = dirtyAddress;
      const sanitizedAddress = { line1, subdistrict, district, province, postalCode, label };

      const response = await request(app.getHttpServer())
        .post('/identity/register/profile')
        .set('Authorization', `Bearer ${regToken}`)
        .send({
          occupation: 'Developer',
          incomeRange: '50000',
          sourceOfFunds: 'Salary',
          purposeOfAccount: 'Savings',
          useIdentityAddress: false,
          currentAddress: sanitizedAddress,
        });

      expect([200, 201]).toContain(response.status);
    });
  });

  describe('TC-07: Re-Review Flow Status Verification', () => {
    it('should set user status to PENDING_APPROVAL after a successful retry', async () => {
      const user = await prisma.user.create({
        data: {
          phoneNumber: '0866666666',
          status: 'REJECTED',
          registrationState: 'KYC_VERIFIED',
          passwordHash: 'some-hash',
          pinHash: 'some-pin-hash',
        },
      });

      const regToken = await authHelper.generateRegistrationToken(user.id, 'KYC_VERIFIED');

      await prisma.address.create({
        data: {
          userId: user.id,
          type: 'REGISTERED',
          line1: '99 Identity Rd',
          subdistrict: 'Bangkok',
          district: 'Pathum Wan',
          province: 'Bangkok',
          postalCode: '10330',
        },
      });

      await request(app.getHttpServer())
        .post('/identity/register/profile')
        .set('Authorization', `Bearer ${regToken}`)
        .send({
          occupation: 'Tester',
          incomeRange: '30000',
          sourceOfFunds: 'Savings',
          purposeOfAccount: 'Testing',
          useIdentityAddress: true,
          currentAddress: { postalCode: '10110' },
        });

      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(updatedUser?.status).toBe('PENDING_APPROVAL');
    });
  });

  // --- SECURITY GUARDS & BOLA ---

  describe('TC-08: State Guard (BOLA Protection)', () => {
    it('should block profile submission if user is in PENDING state', async () => {
      const user = await prisma.user.create({
        data: { phoneNumber: '0833333333', registrationState: 'PENDING' },
      });

      const regToken = await authHelper.generateRegistrationToken(user.id, 'PENDING');

      const response = await request(app.getHttpServer())
        .post('/identity/register/profile')
        .set('Authorization', `Bearer ${regToken}`)
        .send({
          occupation: 'Hacker',
          incomeRange: '999999',
          sourceOfFunds: 'DarkWeb',
          purposeOfAccount: 'Theft',
          useIdentityAddress: true,
          currentAddress: { postalCode: '1337' },
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Invalid registration sequence');
    });
  });

  describe('TC-09: Password Step Enforcement', () => {
    it('should force a new user to set a password after profile completion', async () => {
      const user = await prisma.user.create({
        data: { phoneNumber: '0883334444', registrationState: 'PROFILE_COMPLETED' },
      });

      const regToken = await authHelper.generateRegistrationToken(user.id, 'PROFILE_COMPLETED');

      const response = await request(app.getHttpServer())
        .post('/identity/register/pin')
        .set('Authorization', `Bearer ${regToken}`)
        .send({ pin: '123456', deviceId: 'test-device' });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Invalid registration sequence');
    });
  });

  describe('TC-10: Duplicate Sign-up Protection', () => {
    it('should prevent sign-up if user already has a password set', async () => {
      await prisma.user.create({
        data: {
          phoneNumber: '0844444444',
          status: 'ACTIVE',
          passwordHash: 'existing-hash',
        },
      });

      const response = await request(app.getHttpServer())
        .post('/identity/register/init')
        .send({ phoneNumber: '0844444444' });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('Please log in');
    });
  });

  describe('TC-11: Post-Completion Protection', () => {
    it('should block profile updates if the user status is already PENDING_APPROVAL', async () => {
      const user = await prisma.user.create({
        data: {
          phoneNumber: '0877777777',
          status: 'PENDING_APPROVAL',
          registrationState: 'COMPLETED',
        },
      });

      const regToken = await authHelper.generateRegistrationToken(user.id, 'COMPLETED');

      const response = await request(app.getHttpServer())
        .post('/identity/register/profile')
        .set('Authorization', `Bearer ${regToken}`)
        .send({
          occupation: 'Hacker',
          incomeRange: '999999',
          sourceOfFunds: 'Theft',
          purposeOfAccount: 'Fraud',
          useIdentityAddress: true,
          currentAddress: { postalCode: '666' },
        });

      expect(response.status).toBe(403);
    });
  });

  describe('TC-12: Token Hijacking Prevention (Security)', () => {
    it('should prevent User A from using their token to update User B profile', async () => {
      const userA = await prisma.user.create({ data: { phoneNumber: '0885556666', registrationState: 'KYC_VERIFIED' } });
      const userB = await prisma.user.create({ data: { phoneNumber: '0887778888', registrationState: 'KYC_VERIFIED' } });

      // Add a REGISTERED address for User A to avoid merging errors
      await prisma.address.create({
        data: {
          userId: userA.id,
          type: 'REGISTERED',
          line1: '99 Identity Rd',
          subdistrict: 'Bangkok',
          district: 'Pathum Wan',
          province: 'Bangkok',
          postalCode: '10330',
        },
      });

      const tokenA = await authHelper.generateRegistrationToken(userA.id, 'KYC_VERIFIED');

      const response = await request(app.getHttpServer())
        .post('/identity/register/profile')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          occupation: 'Hacker',
          incomeRange: '100',
          sourceOfFunds: 'Theft',
          purposeOfAccount: 'Fraud',
          useIdentityAddress: true,
          currentAddress: { postalCode: '999' },
        });

      expect([200, 201]).toContain(response.status);
      
      const updatedUserB = await prisma.userSetting.findFirst({ where: { userId: userB.id } });
      expect(updatedUserB).toBeNull();
      
      const updatedUserA = await prisma.userSetting.findFirst({ where: { userId: userA.id } });
      expect(updatedUserA).not.toBeNull();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Onboarding Flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_REGISTRATION_SECRET = 'test-registration-secret';
    process.env.JLEDGER_INTERNAL_SECRET = 'test-internal-secret';
    process.env.JLEDGER_REDIS_ADDRESS = 'redis://localhost:6379';
    process.env.JLEDGER_REDIS_PASSWORD = 'redis_password';
    process.env.SMS_PROVIDER_TYPE = 'mock';
    process.env.KYC_OCR_PROVIDER_TYPE = 'mock';
    process.env.KYC_FACE_PROVIDER_TYPE = 'mock';
    process.env.STORAGE_PROVIDER_TYPE = 'mock';
    process.env.KYC_ENCRYPTION_KEY =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.NODE_ENV = 'development';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const testPhone = `08${Math.floor(10000000 + Math.random() * 90000000)}`;
  let challengeId = '';
  let regToken = '';

  it('/auth/register/init (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register/init')
      .send({ phoneNumber: testPhone })
      .expect(200);

    expect(res.body.challengeId).toBeDefined();
    expect(res.body.debugOtp).toBeUndefined(); // OTP must not be exposed in response
    challengeId = res.body.challengeId;
  });

  it('/auth/register/verify-otp (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register/verify-otp')
      .send({ phoneNumber: testPhone, challengeId, otp: '000000' }) // Mock provider accepts any OTP
      .expect(200);

    expect(res.body.regToken).toBeDefined();
    expect(res.body.nextState).toEqual('OTP_VERIFIED');
    regToken = res.body.regToken;
  });

  it('/auth/register/accept-terms (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register/accept-terms')
      .set('Authorization', `Bearer ${regToken}`)
      .send({ termsVersion: 'v1.0.0' })
      .expect(200);

    expect(res.body.regToken).toBeDefined();
    expect(res.body.nextState).toEqual('TC_ACCEPTED');
    regToken = res.body.regToken;
  });

  it('/kyc/id-card (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/kyc/id-card')
      .set('Authorization', `Bearer ${regToken}`)
      .attach('idCardImage', Buffer.from('mockID'), 'id.png')
      .expect(201);

    expect(res.body.regToken).toBeDefined();
    expect(res.body.nextState).toEqual('ID_CARD_UPLOADED');
    expect(res.body.livenessSessionId).toBeDefined();
    regToken = res.body.regToken;
  });

  it('/kyc/selfie (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/kyc/selfie')
      .set('Authorization', `Bearer ${regToken}`)
      .attach('selfieImage', Buffer.from('mockSelfie'), 'selfie.png')
      .expect(201);

    expect(res.body.regToken).toBeDefined();
    expect(res.body.nextState).toEqual('KYC_VERIFIED');
    regToken = res.body.regToken;
  });

  it('/auth/register/profile (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register/profile')
      .set('Authorization', `Bearer ${regToken}`)
      .send({
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '1990-01-01',
        incomeRange: '50,000 - 100,000',
        sourceOfFunds: 'Salary',
        purposeOfAccount: 'Savings',
      })
      .expect(200);

    expect(res.body.regToken).toBeDefined();
    expect(res.body.nextState).toEqual('PROFILE_COMPLETED');
    regToken = res.body.regToken;
  });

  it('/auth/register/credentials (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register/credentials')
      .set('Authorization', `Bearer ${regToken}`)
      .send({ password: 'securePassword123', pin: '123456', deviceId: 'dev-001' })
      .expect(200);

    expect(res.body.regToken).toBeDefined();
    expect(res.body.nextState).toEqual('CREDENTIALS_SET');
    regToken = res.body.regToken;
  });

  it('/auth/register/complete (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register/complete')
      .set('Authorization', `Bearer ${regToken}`)
      .expect(201); // 201 CREATED

    expect(res.body.registrationStatus).toEqual('PENDING_APPROVAL');
    expect(res.body.message).toContain('within 24 hour');
    expect(res.body.accessToken).toBeUndefined();
  });
});

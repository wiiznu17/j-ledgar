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
    process.env.JLEDGER_REDIS_ADDRESS = 'redis://localhost:6379'; // Assumes local redis for E2E
    process.env.API_GATEWAY_URL = 'http://localhost:8080';
    process.env.KYC_ENCRYPTION_KEY = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';
    process.env.NODE_ENV = 'development'; // to unhide debugOtp

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
  let debugOtp = '';
  let regToken = '';

  it('/auth/register/init (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register/init')
      .send({ phoneNumber: testPhone })
      .expect(200);

    expect(res.body.challengeId).toBeDefined();
    expect(res.body.debugOtp).toBeDefined();
    challengeId = res.body.challengeId;
    debugOtp = res.body.debugOtp;
  });

  it('/auth/register/verify-otp (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register/verify-otp')
      .send({ phoneNumber: testPhone, challengeId, otp: debugOtp })
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

  it('/kyc/submit (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/kyc/submit')
      .set('Authorization', `Bearer ${regToken}`)
      .attach('idCardImage', Buffer.from('mockID'), 'id.png')
      .attach('selfieImage', Buffer.from('mockSelfie'), 'selfie.png')
      .expect(201); // 201 Created by default for POST in NestJS if HttpCode is not specified

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
        purposeOfAccount: 'Savings'
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

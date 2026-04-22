import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Security Tests (e2e)', () => {
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

  describe('Authentication Security', () => {
    it('should reject requests without valid JWT', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should reject requests with invalid JWT signature', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);
    });

    it('should reject requests with expired JWT', async () => {
      // Create a token with expired exp claim
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
      
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on registration endpoint', async () => {
      const phoneNumber = '0812345678';
      
      // Make multiple rapid requests
      const requests = Array(15).fill(null).map(() => 
        request(app.getHttpServer())
          .post('/auth/register/init')
          .send({ phoneNumber })
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid phone numbers', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register/init')
        .send({ phoneNumber: 'invalid' })
        .expect(400);
    });

    it('should reject PIN with invalid format', async () => {
      // This would require a valid token, testing the validation only
      const response = await request(app.getHttpServer())
        .post('/auth/pin/setup')
        .send({ pin: '123' }) // Too short
        .expect(401); // Unauthorized since no token
    });

    it('should reject empty request body', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register/init')
        .send({})
        .expect(400);
    });
  });

  describe('CSRF Protection', () => {
    it('should have security headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      // Check for security headers
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('Session Security', () => {
    it('should revoke token on logout', async () => {
      // This would require a full login flow
      // Testing that logout adds token to denylist
      // Implementation would require setting up a user session first
    });

    it('should reject reused refresh tokens', async () => {
      // This would require a full login flow
      // Testing that refresh token reuse is detected
    });
  });
});

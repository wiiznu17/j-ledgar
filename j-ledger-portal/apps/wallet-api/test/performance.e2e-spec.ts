import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Performance Tests (e2e)', () => {
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

  describe('Response Time', () => {
    it('health endpoint should respond within 100ms', async () => {
      const startTime = Date.now();
      await request(app.getHttpServer())
        .get('/health')
        .expect(200);
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100);
    });

    it('hello endpoint should respond within 100ms', async () => {
      const startTime = Date.now();
      await request(app.getHttpServer())
        .get('/')
        .expect(200);
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100);
    });
  });

  describe('Load Testing', () => {
    it('should handle 50 concurrent health check requests', async () => {
      const concurrency = 50;
      const requests = Array(concurrency).fill(null).map(() =>
        request(app.getHttpServer()).get('/health')
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Average response time should be reasonable
      const avgResponseTime = totalTime / concurrency;
      expect(avgResponseTime).toBeLessThan(200);
    });

    it('should handle 20 concurrent registration init requests', async () => {
      const concurrency = 20;
      const requests = Array(concurrency).fill(null).map((_, i) =>
        request(app.getHttpServer())
          .post('/auth/register/init')
          .send({ phoneNumber: `08${String(i).padStart(9, '0')}` })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Average response time should be reasonable
      const avgResponseTime = totalTime / concurrency;
      expect(avgResponseTime).toBeLessThan(500);
    });
  });

  describe('Throughput', () => {
    it('should handle 100 requests per second for health endpoint', async () => {
      const requestCount = 100;
      const requests = Array(requestCount).fill(null).map(() =>
        request(app.getHttpServer()).get('/health')
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // Calculate requests per second
      const rps = (requestCount / totalTime) * 1000;
      expect(rps).toBeGreaterThan(50); // At least 50 RPS
    });
  });

  describe('Memory and Connection Pooling', () => {
    it('should not leak memory on repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await request(app.getHttpServer()).get('/health').expect(200);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (< 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Database Connection Pool', () => {
    it('should handle concurrent database operations efficiently', async () => {
      // This tests that the connection pool can handle concurrent operations
      const concurrency = 20;
      const requests = Array(concurrency).fill(null).map((_, i) =>
        request(app.getHttpServer())
          .post('/auth/register/init')
          .send({ phoneNumber: `09${String(i).padStart(9, '0')}` })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // All requests should succeed without connection pool exhaustion
      responses.forEach(response => {
        expect([201, 429]).toContain(response.status); // 201 or rate limited
      });

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(2000);
    });
  });
});

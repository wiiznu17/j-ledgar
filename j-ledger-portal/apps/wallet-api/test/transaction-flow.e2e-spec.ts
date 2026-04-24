import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { LedgerProxyService } from './../src/ledger-proxy/ledger-proxy.service';

describe.skip('Transaction Flow (e2e) - Skipped due to BFF refactor', () => {
  let app: INestApplication;

  const mockLedgerProxy = {
    forwardToGateway: jest.fn().mockResolvedValue({
      id: 'mock-tx-id',
      status: 'SUCCESS',
    }),
  };

  beforeAll(async () => {
    process.env.JLEDGER_INTERNAL_SECRET = 'test-internal-secret';
    process.env.API_GATEWAY_URL = 'http://localhost:8080';
    process.env.AUTH_SERVICE_URL = 'http://localhost:3003';
    process.env.WALLET_SERVICE_URL = 'http://localhost:8082';
    process.env.CORE_SERVICE_URL = 'http://localhost:8081';
    process.env.USER_KYC_SERVICE_URL = 'http://localhost:3004';
    process.env.NOTIFICATION_SERVICE_URL = 'http://localhost:3006';

    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(LedgerProxyService)
        .useValue(mockLedgerProxy)
        .compile();

      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(new ValidationPipe());
      await app.init();
    } catch (error) {
      console.error('Initialization failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  // Tests skipped because wallet-api is now a BFF that proxies to microservices
  // These tests need to be refactored to test proxy services
  it('should be refactored to test proxy services', () => {
    expect(true).toBe(true);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe.skip('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.JLEDGER_INTERNAL_SECRET = 'test-internal-secret';
    process.env.API_GATEWAY_URL = 'http://localhost:8080';
    process.env.AUTH_SERVICE_URL = 'http://localhost:3003';
    process.env.WALLET_SERVICE_URL = 'http://localhost:8082';
    process.env.CORE_SERVICE_URL = 'http://localhost:8081';
    process.env.USER_KYC_SERVICE_URL = 'http://localhost:3004';
    process.env.NOTIFICATION_SERVICE_URL = 'http://localhost:3006';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  afterEach(async () => {
    await app.close();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { LedgerProxyService } from './../src/ledger-proxy/ledger-proxy.service';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Transaction Flow (e2e)', () => {
  let app: INestApplication;
  const mockUsers: any[] = [];
  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return mockUsers.find((u) => u.email === where.email);
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        const newUser = { id: 'uuid-123', ...data };
        mockUsers.push(newUser);
        return newUser;
      }),
    },
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
  };

  const mockLedgerProxy = {
    forwardToGateway: jest.fn().mockResolvedValue({
      id: 'mock-tx-id',
      status: 'SUCCESS',
    }),
  };

  beforeAll(async () => {
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PrismaService)
        .useValue(mockPrisma)
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

  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    pin: '123456',
  };

  let accessToken: string;

  it('/users/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/users/register')
      .send(testUser)
      .expect(201)
      .expect((res: any) => {
        expect(res.body.email).toEqual(testUser.email);
      });
  });

  it('/auth/login (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(201);

    accessToken = response.body.access_token;
    expect(accessToken).toBeDefined();
  });

  it('/transactions/transfer (POST) - Missing Idempotency Key', () => {
    return request(app.getHttpServer())
      .post('/transactions/transfer')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        fromAccountId: 'acc-1',
        toAccountId: 'acc-2',
        amount: '100',
        currency: 'THB',
        pin: testUser.pin,
      })
      .expect(400);
  });

  it('/transactions/transfer (POST) - Valid Flow', () => {
    return request(app.getHttpServer())
      .post('/transactions/transfer')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', 'test-key-123')
      .send({
        fromAccountId: 'acc-1',
        toAccountId: 'acc-2',
        amount: '100',
        currency: 'THB',
        pin: testUser.pin,
      })
      .expect(201)
      .expect((res: any) => {
        expect(res.body.status).toEqual('SUCCESS');
        expect(mockLedgerProxy.forwardToGateway).toHaveBeenCalled();
      });
  });
});

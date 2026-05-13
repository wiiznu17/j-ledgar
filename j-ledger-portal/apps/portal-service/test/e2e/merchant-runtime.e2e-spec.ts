import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/core/prisma/prisma.service';
import { DbTestHelper } from '../helpers/db-test.helper';
import * as crypto from 'crypto';

describe('Merchant Runtime Concurrency (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dbHelper: DbTestHelper;

  const terminalId = crypto.randomUUID();
  const secretKey = 'test-secret-key-very-long-and-secure';

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
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    dbHelper = new DbTestHelper(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const generateHeaders = (method: string, path: string, nonce: string, timestamp: string) => {
    const message = `${method.toUpperCase()}:${path}:${timestamp}:${nonce}`;
    const signature = crypto.createHmac('sha256', secretKey).update(message).digest('hex');

    return {
      'x-jledger-terminal-id': terminalId,
      'x-jledger-signature': signature,
      'x-jledger-timestamp': timestamp,
      'x-jledger-nonce': nonce,
    };
  };

  describe('Parallel Redemption', () => {
    let merchant: any;
    let partner: any;
    const redemptionCode = 'CONCUR-CODE-123';

    beforeEach(async () => {
      await dbHelper.clearDatabase();

      partner = await prisma.partner.create({
        data: {
          name: 'Test Partner',
          userId: 'test-user',
          taxId: 'tax-123',
        },
      });

      merchant = await prisma.merchant.create({
        data: {
          partnerId: partner.id,
          name: 'Test Merchant',
        },
      });

      await prisma.terminal.create({
        data: {
          id: terminalId,
          merchantId: merchant.id,
          name: 'Test Terminal',
          secretKey: secretKey,
        },
      });

      // Create a brand and deal for redemption
      const brand = await prisma.brand.create({ data: { name: 'Test Brand' } });
      const category = await prisma.dealCategory.create({ data: { name: 'Food' } });
      const deal = await prisma.deal.create({
        data: {
          brandId: brand.id,
          categoryId: category.id,
          title: 'Test Deal',
          description: 'Desc',
          pointsRequired: 10,
          imageUrl: 'http://img',
        },
      });

      await prisma.dealRedemption.create({
        data: {
          dealId: deal.id,
          userId: 'user-1',
          pointsSpent: 10,
          redemptionCode: redemptionCode,
          status: 'REDEEMED' as any,
        },
      });
    });

    it('should only allow one success out of 10 parallel redemption requests', async () => {
      const numRequests = 10;
      const requests = Array.from({ length: numRequests }).map(async (_, i) => {
        const nonce = `nonce-red-${i}-${crypto.randomBytes(4).toString('hex')}`;
        const ts = Math.floor(Date.now() / 1000).toString();
        const headers = generateHeaders('POST', '/api/v1/terminal/loyalty/redeem', nonce, ts);
        const idemKey = `idem-red-${i}-${crypto.randomBytes(4).toString('hex')}`; // Use DIFFERENT idem keys to simulate DIFFERENT requests

        return request(app.getHttpServer())
          .post('/api/v1/terminal/loyalty/redeem')
          .set(headers)
          .send({ redemptionCode, idempotencyKey: idemKey });
      });

      const responses = await Promise.all(requests);

      const successCount = responses.filter(r => r.status === 200).length;
      const failCount = responses.filter(r => r.status === 400).length;

      expect(successCount).toBe(1);
      expect(failCount).toBe(numRequests - 1);

      const dbRecord = await prisma.dealRedemption.findUnique({
        where: { redemptionCode },
      });
      expect(dbRecord.status).toBe('USED');
    });
  });

  describe('Parallel Payment (Locking)', () => {
    let merchant: any;
    let partner: any;

    beforeEach(async () => {
      await dbHelper.clearDatabase();

      partner = await prisma.partner.create({
        data: {
          name: 'Test Partner',
          userId: 'test-user',
          taxId: 'tax-456',
          financeAccounts: { available: 0, pending: 0, fee: 0 } as any,
        },
      });

      merchant = await prisma.merchant.create({
        data: {
          partnerId: partner.id,
          name: 'Test Merchant',
        },
      });

      await prisma.terminal.create({
        data: {
          id: terminalId,
          merchantId: merchant.id,
          name: 'Test Terminal',
          secretKey: secretKey,
        },
      });
    });

    it('should accurately update balance for 5 parallel payment requests', async () => {
      const numRequests = 5;
      const amountPerRequest = 100;
      const requests = Array.from({ length: numRequests }).map(async (_, i) => {
        const nonce = `nonce-pay-${i}-${crypto.randomBytes(4).toString('hex')}`;
        const ts = Math.floor(Date.now() / 1000).toString();
        const headers = generateHeaders('POST', '/api/v1/terminal/payment', nonce, ts);
        const idemKey = `idem-pay-${i}-${crypto.randomBytes(4).toString('hex')}`;

        return request(app.getHttpServer())
          .post('/api/v1/terminal/payment')
          .set(headers)
          .send({ amount: amountPerRequest, idempotencyKey: idemKey });
      });

      const responses = await Promise.all(requests);
      responses.forEach(r => expect(r.status).toBe(201));

      const updatedPartner = await prisma.partner.findUnique({
        where: { id: partner.id },
      });
      const pendingBalance = (updatedPartner.financeAccounts as any).pending;
      expect(pendingBalance).toBe(numRequests * amountPerRequest);
    });
  });
});

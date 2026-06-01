import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/core/prisma/prisma.service';
import { DbTestHelper } from '../helpers/db-test.helper';
import { FinanceService } from '../../src/core/finance/finance.service';
import { JwtAuthGuard } from '../../src/core/common/guards/jwt-auth.guard';
import { AdminJwtGuard } from '../../src/admin/guards/admin-jwt.guard';
import { AdminPermissionsGuard } from '../../src/admin/guards/admin-permissions.guard';
import * as crypto from 'crypto';

describe('Phase E: E2E Master Flow - Merchant Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dbHelper: DbTestHelper;

  const testUserId = 'master-flow-user';
  const testAdminId = 'master-flow-admin';
  const terminalId = 'FLOW-TERMINAL-123';
  let merchantId: string;
  let partnerId: string;
  let secretKey: string;
  let actualTerminalId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('KafkaProducerService')
      .useValue({
        sendMessage: jest.fn().mockResolvedValue(null),
        onModuleInit: jest.fn(),
      })
      .overrideProvider(FinanceService)
      .useValue({
        createAccount: jest.fn().mockResolvedValue({ id: 'mock-account-id' }),
      })
      // Mock Guards to simulate logged in users based on request headers
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          // Simulate user based on auth header for simplicity in test
          req.user = { sub: req.headers['x-mock-user'] || testUserId };
          return true;
        },
      })
      .overrideGuard(AdminJwtGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = { sub: testAdminId, role: 'SUPER_ADMIN' };
          return true;
        },
      })
      .overrideGuard(AdminPermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    dbHelper = new DbTestHelper(prisma);
  });

  beforeEach(async () => {
    await dbHelper.clearDatabase();
  });

  afterAll(async () => {
    await app.close();
  });

  const generateTerminalHeaders = (
    method: string,
    path: string,
    nonce: string,
    timestamp: string,
    secKey: string,
  ) => {
    const message = `${method.toUpperCase()}:${path}:${timestamp}:${nonce}`;
    const signature = crypto
      .createHmac('sha256', secKey)
      .update(message)
      .digest('hex');
    return {
      'x-jledger-terminal-id': actualTerminalId,
      'x-jledger-signature': signature,
      'x-jledger-timestamp': timestamp,
      'x-jledger-nonce': nonce,
    };
  };

  it('should successfully execute the full merchant lifecycle end-to-end', async () => {
    // 1. Setup Initial Partner Application
    const partner = await prisma.partner.create({
      data: {
        name: 'Master Flow Partner',
        userId: testUserId,
        status: 'ACTIVE',
      },
    });
    partnerId = partner.id;

    const application = await prisma.merchantApplication.create({
      data: {
        partnerId: partner.id,
        businessName: 'Master Flow Business',
        userId: testUserId,
        taxId: '1231231231234',
        category: 'Food',
        contactName: 'Master Owner',
        email: 'master@example.com',
        phone: '0812345678',
        address: '123 Master St',
        status: 'PENDING' as any,
      },
    });

    // 2. Admin Approves Merchant Application
    const reviewRes = await request(app.getHttpServer())
      .put(`/api/v1/admin/merchants/applications/${application.id}/review`)
      .set('Authorization', 'Bearer mock-admin-token')
      .send({ status: 'APPROVED', note: 'Looks good' });

    expect(reviewRes.status).toBe(200);

    // Get the created merchant ID from the DB
    const merchant = await prisma.merchant.findFirst({
      where: { partnerId: partner.id },
    });
    expect(merchant).toBeDefined();
    merchantId = merchant!.id;

    // 3. Admin Creates a Terminal for the Merchant
    const terminalRes = await request(app.getHttpServer())
      .post(`/api/v1/admin/merchants/${merchantId}/terminals`)
      .set('Authorization', 'Bearer mock-admin-token')
      .send({ name: 'Flow Terminal', hardwareId: terminalId });

    expect(terminalRes.status).toBe(201);
    expect(terminalRes.body.secretKey).toBeDefined();
    secretKey = terminalRes.body.secretKey;
    actualTerminalId = terminalRes.body.id;

    // 4. Terminal Executes a Payment (Idempotency Check)
    const idempotencyKey = 'idempotency-flow-master-key-123';
    const ts1 = Math.floor(Date.now() / 1000).toString();
    const nonce1 = crypto.randomBytes(8).toString('hex');
    const headers1 = generateTerminalHeaders(
      'POST',
      '/api/v1/terminal/payment',
      nonce1,
      ts1,
      secretKey,
    );

    const paymentRes1 = await request(app.getHttpServer())
      .post('/api/v1/terminal/payment')
      .set(headers1)
      .send({ amount: 1000, idempotencyKey });

    expect(paymentRes1.status).toBe(201);

    // 4b. Replay Same Request (Idempotent Success)
    const nonce1b = crypto.randomBytes(8).toString('hex');
    const headers1b = generateTerminalHeaders(
      'POST',
      '/api/v1/terminal/payment',
      nonce1b,
      ts1,
      secretKey,
    );
    const paymentRes2 = await request(app.getHttpServer())
      .post('/api/v1/terminal/payment')
      .set(headers1b)
      .send({ amount: 1000, idempotencyKey });

    expect(paymentRes2.status).toBe(201); // Returns cached success

    // 4c. Send Same Key with DIFFERENT payload (Conflict rejection)
    const nonce1c = crypto.randomBytes(8).toString('hex');
    const headers1c = generateTerminalHeaders(
      'POST',
      '/api/v1/terminal/payment',
      nonce1c,
      ts1,
      secretKey,
    );
    const paymentRes3 = await request(app.getHttpServer())
      .post('/api/v1/terminal/payment')
      .set(headers1c)
      .send({ amount: 9999, idempotencyKey }); // Different amount

    expect(paymentRes3.status).toBe(409); // Conflict rejection

    // 5. Merchant Checks Dashboard Data (Wallet App simulation)
    const dashboardRes = await request(app.getHttpServer())
      .get('/api/v1/merchant/dashboard')
      .set('x-mock-user', testUserId);

    expect(dashboardRes.status).toBe(200);
    expect(dashboardRes.body.totalTransactions).toBeGreaterThanOrEqual(1);
    expect(dashboardRes.body.totalRevenue).toBeGreaterThanOrEqual(1000);
    expect(dashboardRes.body.activeTerminals).toBeGreaterThanOrEqual(1);
  });
});

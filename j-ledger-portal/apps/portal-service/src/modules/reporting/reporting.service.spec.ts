import { Test, TestingModule } from '@nestjs/testing';
import { ReportingService } from './reporting.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { INTERNAL_API_PATHS } from '@repo/dto';
import {
  createMockConfigService,
  createMockHttpService,
} from '../../__tests__/test-utils';

describe('ReportingService', () => {
  let service: ReportingService;
  let httpService: any;
  let configService: any;

  beforeEach(async () => {
    httpService = createMockHttpService();
    configService = createMockConfigService({
      FINANCE_SERVICE_URL: 'http://localhost:8081',
      JLEDGER_INTERNAL_SECRET: 'mock_internal_secret',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<ReportingService>(ReportingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDailyReport', () => {
    it('should aggregate transactions, calculate amounts, averages, and group by type/status', async () => {
      httpService.axiosRef.request.mockResolvedValue({
        data: {
          content: [
            { amount: '150.00', transactionType: 'PAYMENT', status: 'COMPLETED' },
            { amount: '350.00', transactionType: 'TRANSFER', status: 'COMPLETED' },
            { amount: '100.00', transactionType: 'PAYMENT', status: 'FAILED' },
          ],
        },
      });

      const result = await service.getDailyReport('2026-05-29');

      expect(httpService.axiosRef.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: expect.stringContaining('/api/v1/transactions'),
        }),
      );

      expect(result).toEqual({
        date: '2026-05-29',
        totalTransactions: 3,
        totalAmount: 600,
        avgAmount: 200,
        byType: { PAYMENT: 2, TRANSFER: 1 },
        byStatus: { COMPLETED: 2, FAILED: 1 },
      });
    });

    it('should return empty/zeroed state when no transactions are fetched', async () => {
      httpService.axiosRef.request.mockResolvedValue({
        data: { content: [] },
      });

      const result = await service.getDailyReport('2026-05-29');

      expect(result).toEqual({
        date: '2026-05-29',
        totalTransactions: 0,
        totalAmount: 0,
        avgAmount: 0,
        byType: {},
        byStatus: {},
      });
    });
  });

  describe('getMonthlyReport', () => {
    it('should compute monthly metrics with a 1% revenue share', async () => {
      httpService.axiosRef.request.mockResolvedValue({
        data: {
          content: [
            { amount: '1000.00', transactionType: 'TOPUP', status: 'COMPLETED' },
            { amount: '2000.00', transactionType: 'PAYMENT', status: 'COMPLETED' },
          ],
        },
      });

      const result = await service.getMonthlyReport(2026, 5);

      expect(result).toEqual({
        year: 2026,
        month: 5,
        totalTransactions: 2,
        totalAmount: 3000,
        avgAmount: 1500,
        byType: { TOPUP: 1, PAYMENT: 1 },
        byStatus: { COMPLETED: 2 },
        revenue: 30, // 3000 * 0.01
      });
    });
  });

  describe('getAdminAnalytics', () => {
    it('should compute network volumes, growth rate, and solvency metrics based on latest reconciliation', async () => {
      // Mocking 4 API requests:
      // 1. Current Transactions
      // 2. Previous Transactions
      // 3. Reconciliation reports list
      // 4. Treasury Summary
      httpService.axiosRef.request
        // 1. Current transactions
        .mockResolvedValueOnce({
          data: {
            content: [
              { amount: '500.00', status: 'COMPLETED', fee: '15.00' },
              { amount: '300.00', status: 'COMPLETED', fee: '9.00' },
              { amount: '200.00', status: 'FAILED' },
            ],
          },
        })
        // 2. Previous transactions (for growth)
        .mockResolvedValueOnce({
          data: {
            content: [
              { amount: '400.00', status: 'COMPLETED' },
            ],
          },
        })
        // 3. Reconciliation reports list
        .mockResolvedValueOnce({
          data: [
            {
              id: 'recon-1',
              totalSystemAssets: '10000.00',
              totalUserLiabilities: '9500.00',
              discrepancy: '100.00',
            },
          ],
        })
        // 4. Treasury summary (catch/fallback)
        .mockResolvedValueOnce({
          data: {
            totalRealAssets: 10000,
            totalCustomerLiability: 9500,
          },
        });

      const result = await service.getAdminAnalytics({ timeframe: '7D' });

      expect(result.stats.networkVolume).toBe(800); // 500 + 300
      expect(result.stats.volumeGrowth).toBe(100); // (800 - 400)/400 * 100
      expect(result.stats.feeEarnings).toBe(24); // 15 + 9
      expect(result.stats.totalAssets).toBe(10000);
      expect(result.stats.totalLiabilities).toBe(9500);
      expect(result.stats.solvencySurplus).toBe(500); // 10000 - 9500
      expect(result.stats.reconciledRatio).toBe(99); // 100 - (100 / 10000)*100
      expect(result.stats.completedTransactions).toBe(2);
      expect(result.stats.failedTransactions).toBe(1);
    });

    it('should fallback to treasury summary values when no reconciliation report exists', async () => {
      httpService.axiosRef.request
        // Current transactions
        .mockResolvedValueOnce({ data: { content: [] } })
        // Previous transactions
        .mockResolvedValueOnce({ data: [] })
        // Reconciliation reports (empty)
        .mockResolvedValueOnce({ data: [] })
        // Treasury summary fallback
        .mockResolvedValueOnce({
          data: {
            totalRealAssets: '5000.0000',
            totalCustomerLiability: '4800.0000',
          },
        });

      const result = await service.getAdminAnalytics({ timeframe: '30D' });

      expect(result.stats.totalAssets).toBe(5000);
      expect(result.stats.totalLiabilities).toBe(4800);
      expect(result.stats.solvencySurplus).toBe(200);
    });
  });

  describe('getReconciliationReports & getReconciliationReport', () => {
    it('should forward page and size parameters correctly to gateway', async () => {
      httpService.axiosRef.request.mockResolvedValue({
        data: [{ id: 'report-1' }],
      });

      const result = await service.getReconciliationReports({ page: 2, limit: 10 });

      expect(httpService.axiosRef.request).toHaveBeenCalledWith({
        method: 'GET',
        url: 'http://localhost:8081' + INTERNAL_API_PATHS.FINANCE.SYSTEM.RECONCILE.REPORTS,
        params: { page: '2', limit: '10' },
        headers: { 'X-Internal-Secret': 'mock_internal_secret' },
      });
      expect(result).toHaveLength(1);
    });

    it('should fetch single report detail by ID', async () => {
      httpService.axiosRef.request.mockResolvedValue({
        data: { id: 'report-123', logs: [] },
      });

      const result = await service.getReconciliationReport('report-123');

      expect(httpService.axiosRef.request).toHaveBeenCalledWith({
        method: 'GET',
        url: 'http://localhost:8081' + INTERNAL_API_PATHS.FINANCE.SYSTEM.RECONCILE.DETAIL('report-123'),
        headers: { 'X-Internal-Secret': 'mock_internal_secret' },
      });
      expect(result.id).toBe('report-123');
    });
  });

  describe('runReconciliation', () => {
    it('should trigger reconciliation with a POST request', async () => {
      httpService.axiosRef.request.mockResolvedValue({
        data: { success: true },
      });

      const result = await service.runReconciliation();

      expect(httpService.axiosRef.request).toHaveBeenCalledWith({
        method: 'POST',
        url: 'http://localhost:8081' + INTERNAL_API_PATHS.FINANCE.SYSTEM.RECONCILE.TRIGGER,
        headers: { 'X-Internal-Secret': 'mock_internal_secret' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Outbox System', () => {
    it('should fetch outbox events with query options', async () => {
      httpService.axiosRef.request.mockResolvedValue({
        data: [{ id: 'evt-1' }],
      });

      const result = await service.getOutbox({ status: 'FAILED', page: 1, limit: 50 });

      expect(httpService.axiosRef.request).toHaveBeenCalledWith({
        method: 'GET',
        url: 'http://localhost:8081' + INTERNAL_API_PATHS.FINANCE.SYSTEM.OUTBOX.BASE,
        params: { status: 'FAILED', page: '1', limit: '50' },
        headers: { 'X-Internal-Secret': 'mock_internal_secret' },
      });
      expect(result).toHaveLength(1);
    });

    it('should retry a single outbox event with a POST request', async () => {
      httpService.axiosRef.request.mockResolvedValue({
        data: { success: true },
      });

      const result = await service.retryOutbox('evt-999');

      expect(httpService.axiosRef.request).toHaveBeenCalledWith({
        method: 'POST',
        url: 'http://localhost:8081' + INTERNAL_API_PATHS.FINANCE.SYSTEM.OUTBOX.RETRY('evt-999'),
        headers: { 'X-Internal-Secret': 'mock_internal_secret' },
      });
      expect(result.success).toBe(true);
    });
  });
});

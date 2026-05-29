import { Test, TestingModule } from '@nestjs/testing';
import { AuditService, AuditAction, ResourceType } from './audit.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { createMockPrismaService } from '../../__tests__/test-utils';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: any;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create an audit log with masked sensitive data', async () => {
      const data = {
        adminUserId: 'admin-1',
        action: AuditAction.CREATE,
        resourceType: ResourceType.USER,
        resourceId: 'user-123',
        responseStatus: 200,
        requestPayload: {
          username: 'john_doe',
          password: 'supersecretpassword',
          pin: '1234',
        },
      };

      prisma.auditLog.create.mockResolvedValue({ id: 'log-1', ...data });

      await service.log(data);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          adminUserId: 'admin-1',
          userId: undefined,
          action: AuditAction.CREATE,
          resourceType: ResourceType.USER,
          resourceId: 'user-123',
          ipAddress: undefined,
          userAgent: undefined,
          requestPayload: {
            username: 'john_doe',
            password: '***MASKED***',
            pin: '***MASKED***',
          },
          responseStatus: 200,
          changes: undefined,
          reason: undefined,
        },
      });
    });

    it('should mask nested sensitive fields recursively', async () => {
      const data = {
        action: AuditAction.UPDATE,
        resourceType: ResourceType.SYSTEM_SETTINGS,
        resourceId: 'system',
        responseStatus: 200,
        requestPayload: {
          nested: {
            secretKey: 'my-secret-key',
            token: 'bearer-token-123',
            normalField: 'hello',
          },
        },
        changes: {
          before: {
            nested: {
              secretKey: 'old-secret',
            },
          },
          after: {
            nested: {
              secretKey: 'new-secret',
            },
          },
        },
      };

      prisma.auditLog.create.mockResolvedValue({ id: 'log-2', ...data });

      await service.log(data);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          adminUserId: undefined,
          userId: undefined,
          action: AuditAction.UPDATE,
          resourceType: ResourceType.SYSTEM_SETTINGS,
          resourceId: 'system',
          ipAddress: undefined,
          userAgent: undefined,
          requestPayload: {
            nested: {
              secretKey: '***MASKED***',
              token: '***MASKED***',
              normalField: 'hello',
            },
          },
          responseStatus: 200,
          changes: {
            before: {
              nested: {
                secretKey: '***MASKED***',
              },
            },
            after: {
              nested: {
                secretKey: '***MASKED***',
              },
            },
          },
          reason: undefined,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated results with staff actor details', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          adminUserId: 'staff-1',
          action: AuditAction.CREATE,
          resourceType: ResourceType.USER,
          resourceId: 'user-1',
          createdAt: new Date(),
        },
        {
          id: 'log-2',
          adminUserId: null,
          action: AuditAction.LOGIN,
          resourceType: ResourceType.USER,
          resourceId: 'user-2',
          createdAt: new Date(),
        },
      ];

      const mockStaff = [
        {
          id: 'staff-1',
          username: 'staff_user',
          firstName: 'John',
          lastName: 'Doe',
        },
      ];

      prisma.auditLog.findMany.mockResolvedValue(mockLogs);
      prisma.auditLog.count.mockResolvedValue(10);
      prisma.staff.findMany.mockResolvedValue(mockStaff);

      const result = await service.findAll({ page: 1, limit: 2 });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 2,
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.auditLog.count).toHaveBeenCalledWith({ where: {} });
      expect(prisma.staff.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['staff-1'] } },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].adminUser).toEqual({
        username: 'staff_user',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.data[1].adminUser).toBeNull();
      expect(result.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 10,
        totalPages: 5,
      });
    });

    it('should filter by adminUserId, action, resourceType, date range', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.auditLog.count.mockResolvedValue(0);

      const query = {
        adminUserId: 'admin-1',
        action: AuditAction.DELETE,
        resourceType: ResourceType.ROLE,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      };

      await service.findAll(query);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          adminUserId: 'admin-1',
          action: AuditAction.DELETE,
          resourceType: ResourceType.ROLE,
          createdAt: {
            gte: query.startDate,
            lte: query.endDate,
          },
        },
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getAuditStats', () => {
    it('should return correct counts for creations, updates, deletions', async () => {
      prisma.auditLog.count
        .mockResolvedValueOnce(100) // Total
        .mockResolvedValueOnce(30)  // Creations
        .mockResolvedValueOnce(50)  // Updates
        .mockResolvedValueOnce(20); // Deletions

      const result = await service.getAuditStats();

      expect(result).toEqual({
        total: 100,
        creations: 30,
        updates: 50,
        deletions: 20,
      });
    });
  });
});

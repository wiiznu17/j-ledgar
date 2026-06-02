import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PaginationUtility } from '../../common/utils/pagination.util';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  READ = 'READ',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ASSIGN = 'ASSIGN',
  REMOVE = 'REMOVE',
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',
  RESET_PASSWORD = 'RESET_PASSWORD',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  SYNC_PERMISSIONS = 'SYNC_PERMISSIONS',
  MERCHANT_PAYMENT = 'MERCHANT_PAYMENT',
  MERCHANT_REDEMPTION = 'MERCHANT_REDEMPTION',
  SETTLEMENT = 'SETTLEMENT',
}

export enum ResourceType {
  TRANSACTION = 'TRANSACTION',
  ACCOUNT = 'ACCOUNT',
  USER = 'USER',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RECONCILIATION_REPORT = 'RECONCILIATION_REPORT',
  ADMIN_USER = 'ADMIN_USER',
  KYC_DOCUMENT = 'KYC_DOCUMENT',
  PII = 'PII',
  ROLE = 'ROLE',
  PERMISSION = 'PERMISSION',
  MERCHANT = 'MERCHANT',
  TERMINAL = 'TERMINAL',
  PARTNER = 'PARTNER',
  DEAL = 'DEAL',
  BANNER = 'BANNER',
  LOYALTY_RULE = 'LOYALTY_RULE',
  SYSTEM_SETTINGS = 'SYSTEM_SETTINGS',
  SYSTEM_OUTBOX = 'SYSTEM_OUTBOX',
}

export interface AuditLogData {
  adminUserId?: string;
  userId?: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  ipAddress?: string;
  userAgent?: string;
  requestPayload?: Record<string, any>;
  responseStatus: number;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  reason?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogData) {
    // Mask sensitive data
    const maskedPayload = this.maskSensitiveData(data.requestPayload);
    const maskedChanges = data.changes
      ? {
          before: this.maskSensitiveData(data.changes.before),
          after: this.maskSensitiveData(data.changes.after),
        }
      : undefined;

    return this.prisma.auditLog.create({
      data: {
        adminUserId: data.adminUserId,
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        requestPayload: maskedPayload,
        responseStatus: data.responseStatus,
        changes: maskedChanges,
        reason: data.reason,
      },
    });
  }

  private maskSensitiveData(data: any): any {
    if (!data) return data;
    if (Array.isArray(data)) return data.map((i) => this.maskSensitiveData(i));
    if (typeof data !== 'object') return data;

    const sensitiveFields = [
      'password',
      'pin',
      'secret',
      'secretKey',
      'token',
      'apiKey',
      'creditCard',
    ];
    const masked = { ...data };

    for (const key in masked) {
      if (
        sensitiveFields.some((f) => key.toLowerCase().includes(f.toLowerCase()))
      ) {
        masked[key] = '***MASKED***';
      } else if (typeof masked[key] === 'object') {
        masked[key] = this.maskSensitiveData(masked[key]);
      }
    }

    return masked;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    adminUserId?: string;
    userId?: string;
    action?: AuditAction;
    resourceType?: ResourceType;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (query.adminUserId) where.adminUserId = query.adminUserId;
    if (query.userId) where.userId = query.userId;
    if (query.action) where.action = query.action;
    if (query.resourceType) where.resourceType = query.resourceType;
    if (query.resourceId) where.resourceId = query.resourceId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = query.startDate;
      if (query.endDate) where.createdAt.lte = query.endDate;
    }

    const result = await PaginationUtility.paginate(
      (opts) =>
        this.prisma.auditLog.findMany({
          where,
          ...opts,
        }),
      () => this.prisma.auditLog.count({ where }),
      {
        page: query.page,
        limit: query.limit || 50,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
    );

    // Fetch matching staff actor details in-memory to avoid complex schema changes
    const adminUserIds = Array.from(
      new Set(result.data.map((log) => log.adminUserId).filter(Boolean)),
    ) as string[];

    const staffMembers =
      adminUserIds.length > 0
        ? await this.prisma.staff.findMany({
            where: { id: { in: adminUserIds } },
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          })
        : [];

    const staffMap = new Map(staffMembers.map((s) => [s.id, s]));

    const mappedData = result.data.map((log) => {
      const staff = log.adminUserId ? staffMap.get(log.adminUserId) : null;
      return {
        ...log,
        adminUser: staff
          ? {
              username: staff.username,
              firstName: staff.firstName,
              lastName: staff.lastName,
            }
          : null,
      };
    });

    return {
      ...result,
      data: mappedData,
    };
  }

  async getAuditStats() {
    const [total, creations, updates, deletions] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({
        where: {
          OR: [
            { action: { contains: 'CREATE' } },
            { action: { contains: 'APPROVE' } },
            { action: { contains: 'ACTIVATE' } },
          ],
        },
      }),
      this.prisma.auditLog.count({
        where: {
          OR: [
            { action: { contains: 'UPDATE' } },
            { action: { contains: 'MANAGE' } },
            { action: { contains: 'SYNC' } },
            { action: { contains: 'RESET' } },
            { action: { contains: 'ASSIGN' } },
            { action: { contains: 'FREEZE' } },
          ],
        },
      }),
      this.prisma.auditLog.count({
        where: {
          OR: [
            { action: { contains: 'DELETE' } },
            { action: { contains: 'REMOVE' } },
            { action: { contains: 'REJECT' } },
            { action: { contains: 'DEACTIVATE' } },
          ],
        },
      }),
    ]);

    return {
      total,
      creations,
      updates,
      deletions,
    };
  }
}

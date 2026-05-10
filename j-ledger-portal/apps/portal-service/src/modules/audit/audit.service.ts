import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

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
}

export interface AuditLogData {
  adminUserId: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
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

    const sensitiveFields = [
      'password',
      'pin',
      'secret',
      'token',
      'apiKey',
      'creditCard',
    ];
    const masked = { ...data };

    for (const field of sensitiveFields) {
      if (masked[field]) {
        masked[field] = '***MASKED***';
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
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

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

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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

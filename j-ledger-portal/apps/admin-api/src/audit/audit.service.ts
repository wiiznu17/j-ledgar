import { Injectable } from '@nestjs/common';
import { AuditProxyService } from '../proxies/audit-proxy.service';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  READ = 'READ',
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
  SYSTEM = 'SYSTEM',
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
  constructor(private auditProxy: AuditProxyService) {}

  async log(data: AuditLogData) {
    // Mask sensitive data
    const maskedPayload = this.maskSensitiveData(data.requestPayload);
    const maskedChanges = data.changes
      ? {
          before: this.maskSensitiveData(data.changes.before),
          after: this.maskSensitiveData(data.changes.after),
        }
      : undefined;

    return this.auditProxy.log({
      ...data,
      requestPayload: maskedPayload,
      changes: maskedChanges,
    });
  }

  private maskSensitiveData(data: any): any {
    if (!data) return data;

    const sensitiveFields = ['password', 'pin', 'secret', 'token', 'apiKey', 'creditCard'];
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
    action?: AuditAction;
    resourceType?: ResourceType;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return this.auditProxy.findAll(query);
  }
}

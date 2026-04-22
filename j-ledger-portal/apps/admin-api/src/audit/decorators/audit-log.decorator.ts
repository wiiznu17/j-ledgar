import { SetMetadata } from '@nestjs/common';
import { AUDIT_LOG_KEY } from '../audit.interceptor';
import { AuditAction, ResourceType } from '../audit.service';

export interface AuditLogOptions {
  action: AuditAction;
  resourceType: ResourceType;
  getResourceId: (request: any) => string;
}

export const AuditLog = (options: AuditLogOptions) =>
  SetMetadata(AUDIT_LOG_KEY, options);

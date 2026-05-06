import { SetMetadata } from '@nestjs/common';
import { AuditAction, ResourceType } from '../../modules/audit/audit.service';

export const AUDIT_LOG_KEY = 'audit_log';

export interface AuditMetadata {
  action: AuditAction;
  resourceType: ResourceType;
  resourceIdPath?: string; // e.g. 'params.id' or 'body.userId'
  reason?: string;
}

export const AuditLog = (action: AuditAction, resourceType: ResourceType, reason?: string, resourceIdPath?: string) => 
  SetMetadata(AUDIT_LOG_KEY, { action, resourceType, reason, resourceIdPath });

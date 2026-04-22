import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService, AuditAction, ResourceType } from './audit.service';

export const AUDIT_LOG_KEY = 'auditLog';

export interface AuditLogMetadata {
  action: AuditAction;
  resourceType: ResourceType;
  getResourceId: (request: any) => string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get audit metadata from the handler decorator
    const metadata = Reflect.getMetadata(AUDIT_LOG_KEY, context.getHandler());

    if (!metadata || !request.user) {
      return next.handle();
    }

    const { action, resourceType, getResourceId } = metadata as AuditLogMetadata;
    const resourceId = getResourceId(request);

    // Capture request details
    const ipAddress = request.ip || request.connection.remoteAddress;
    const userAgent = request.headers['user-agent'];
    const requestPayload = this.sanitizePayload(request.body);

    return next.handle().pipe(
      tap({
        next: async (data) => {
          try {
            await this.auditService.log({
              adminUserId: request.user.id,
              action,
              resourceType,
              resourceId,
              ipAddress,
              userAgent,
              requestPayload,
              responseStatus: response.statusCode,
              reason: request.body?.reason,
            });
          } catch (error) {
            this.logger.error('Failed to create audit log', error);
          }
        },
        error: async (error) => {
          try {
            await this.auditService.log({
              adminUserId: request.user.id,
              action,
              resourceType,
              resourceId,
              ipAddress,
              userAgent,
              requestPayload,
              responseStatus: error.status || 500,
              reason: `Error: ${error.message}`,
            });
          } catch (logError) {
            this.logger.error('Failed to create audit log for error', logError);
          }
        },
      }),
    );
  }

  private sanitizePayload(payload: any): any {
    if (!payload) return payload;

    const sensitiveFields = ['password', 'pin', 'secret', 'token', 'apiKey'];
    const sanitized = { ...payload };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***MASKED***';
      }
    }

    return sanitized;
  }
}

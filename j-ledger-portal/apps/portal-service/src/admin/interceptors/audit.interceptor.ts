import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditService, AuditAction, ResourceType } from '../../modules/audit/audit.service';
import { AUDIT_LOG_KEY, AuditMetadata } from '../decorators/audit.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission } from '@repo/dto';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): any {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, body, params, query } = request;
    const adminUser = request.user; // Assuming AdminJwtGuard has populated this

    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // STRICT: Only log if permission is required
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return next.handle();
    }

    // Get metadata from decorator (optional now)
    const metadata = this.reflector.getAllAndOverride<AuditMetadata>(AUDIT_LOG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const primaryPermission = requiredPermissions[0];
    const actionReason = metadata?.reason || `Executed permission: ${primaryPermission}`;
    const actionType = primaryPermission as any; // Use permission name as action
    const resourceType = metadata?.resourceType || ResourceType.PII;

    return (next.handle() as any).pipe(
      tap({
        next: async (data) => {
          try {
            const response = context.switchToHttp().getResponse();

            // Extract Resource ID if path provided
            let resourceId = null;
            if (metadata?.resourceIdPath) {
              resourceId = this.getValueByPath(request, metadata.resourceIdPath);
            } else if (params.id) {
              resourceId = params.id;
            } else if (data && (data as any).id) {
              // Capture ID from response (crucial for CREATIONS)
              resourceId = (data as any).id;
            }

            await this.auditService.log({
              adminUserId: adminUser?.sub || adminUser?.id || 'SYSTEM',
              action: actionType,
              resourceType: resourceType,
              resourceId: String(resourceId || ''),
              ipAddress: ip,
              userAgent: request.get('user-agent') || '',
              requestPayload: {
                body,
                params,
                query,
              },
              responseStatus: response.statusCode,
              reason: actionReason,
              // Changes could be implemented here if we fetch data before update
            });
          } catch (error) {
            this.logger.error(`Failed to record audit log: ${error.message}`);
          }
        },
        error: async (err) => {
          // Log failed attempts too if needed
          try {
            await this.auditService.log({
              adminUserId: adminUser?.sub || adminUser?.id || 'SYSTEM',
              action: actionType,
              resourceType: resourceType,
              resourceId: String(params.id || ''),
              ipAddress: ip,
              userAgent: request.get('user-agent') || '',
              requestPayload: { body, params, query },
              responseStatus: err.status || 500,
              reason: actionReason
                ? `${actionReason} (Failed: ${err.message})`
                : `Failed: ${err.message}`,
            });
          } catch (logError) {
            this.logger.error(`Failed to record failed audit log: ${logError.message}`);
          }
        },
      }),
    );
  }

  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }
}

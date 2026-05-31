import {
  Injectable,
} from '@nestjs/common';
import { map } from 'rxjs/operators';

/**
 * Standardized API Response Interceptor
 * 
 * NOTE: We use 'any' for the NestInterceptor interface and Observable types 
 * to bypass RxJS version conflicts in the monorepo.
 */
@Injectable()
export class TransformInterceptor {
  intercept(
    context: any,
    next: any,
  ): any {
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      map((data: any) => {
        // If data already looks like our envelope, don't double wrap
        if (data && typeof data === 'object' && data.success === true && 'meta' in data) {
          return data;
        }

        // Standard wrap
        return {
          success: true,
          data: data,
          meta: {
            traceId: request.id,
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}

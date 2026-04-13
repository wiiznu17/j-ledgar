import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { REQUIRE_IDEMPOTENCY_KEY } from '../decorators/idempotency.decorator';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isIdempotencyRequired = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_IDEMPOTENCY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isIdempotencyRequired) {
      const request = context.switchToHttp().getRequest();
      const idempotencyKey = request.headers['idempotency-key'];

      if (!idempotencyKey) {
        throw new BadRequestException('Idempotency-Key header is required for this request');
      }
    }

    return next.handle();
  }
}

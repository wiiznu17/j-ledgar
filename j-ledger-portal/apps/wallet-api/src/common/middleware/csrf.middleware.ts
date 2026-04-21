import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * CSRF-like protection for state-changing operations.
 *
 * Since wallet-api uses Bearer tokens (not cookies), traditional CSRF is not
 * a primary threat vector. However, this middleware adds defense-in-depth by
 * requiring a custom header on all state-changing requests, which browsers
 * enforce via CORS preflight but direct API calls cannot bypass.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly REQUIRED_HEADER = 'X-Requested-With';
  private readonly REQUIRED_VALUE = 'XMLHttpRequest';

  private readonly STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

  use(req: Request, res: Response, next: NextFunction) {
    if (this.STATE_CHANGING_METHODS.has(req.method.toUpperCase())) {
      const headerValue = req.headers[this.REQUIRED_HEADER.toLowerCase()];
      if (headerValue !== this.REQUIRED_VALUE) {
        throw new BadRequestException(
          `Missing or invalid ${this.REQUIRED_HEADER} header for ${req.method} request`,
        );
      }
    }
    next();
  }
}

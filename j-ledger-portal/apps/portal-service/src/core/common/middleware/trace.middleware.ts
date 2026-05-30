import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TraceStorage } from '../trace-storage';

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract traceId (from Pino-http req.id or Header)
    const traceId = (req as any).id || req.headers['x-trace-id'] || Math.random().toString(36).slice(2, 9);
    
    TraceStorage.run(traceId, () => {
      next();
    });
  }
}

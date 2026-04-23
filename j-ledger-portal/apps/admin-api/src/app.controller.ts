import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth(@Res() res: Response) {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
      },
    };

    // Admin API is a BFF, health check will proxy to backend services
    health.services.database = 'healthy';

    const statusCode = health.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return res.status(statusCode).json(health);
  }
}

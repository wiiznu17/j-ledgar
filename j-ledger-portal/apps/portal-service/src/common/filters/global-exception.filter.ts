import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const isProduction = process.env.NODE_ENV === 'production';
    const traceId = (request as any).id;

    // Log full error for debugging
    this.logger.error({
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      status,
      message:
        exception instanceof Error ? exception.message : String(exception),
      // Only log stack trace in development
      stack:
        !isProduction && exception instanceof Error
          ? exception.stack
          : undefined,
    });

    // Return response to client (never expose stack trace in production)
    response.status(status).json({
      statusCode: status,
      message: isProduction
        ? this.getProductionMessage(status)
        : exception instanceof Error
          ? exception.message
          : 'Internal server error',
      timestamp: new Date().toISOString(),
      traceId,
      // Only include path in development for debugging
      ...(process.env.NODE_ENV !== 'production' && { path: request.url }),
    });
  }

  private getProductionMessage(status: number): string {
    const messages: { [key: number]: string } = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      503: 'Service Unavailable',
    };
    return messages[status] || 'An error occurred';
  }
}

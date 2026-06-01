import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiErrorResponse } from '@repo/dto';

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

    let errorCode: string | number = status;
    let errorMessage = exception instanceof Error ? exception.message : 'Internal server error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      const responseObj = exception.getResponse();
      if (typeof responseObj === 'object' && responseObj !== null) {
        errorCode = (responseObj as any).code || (responseObj as any).error || status;
        errorMessage = (responseObj as any).message || exception.message;
        details = (responseObj as any).details || undefined;

        // ในกรณีที่เป็น NestJS Class Validation (Array error messages)
        if (Array.isArray((responseObj as any).message)) {
          errorCode = 'SYSTEM_VALIDATION_ERROR';
          errorMessage = 'Validation failed';
          details = (responseObj as any).message;
        }
      }
    }

    if (isProduction && status >= 500) {
      errorMessage = this.getProductionMessage(status);
    }

    // Construct standardized error response
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        ...(details !== undefined && { details }),
      },
      meta: {
        traceId,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV !== 'production' && { path: request.url }),
      },
    };

    // Return response to client
    response.status(status).json(errorResponse);
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

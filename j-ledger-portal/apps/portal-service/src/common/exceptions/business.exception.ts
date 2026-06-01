import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@repo/dto';

export class BusinessException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: any,
  ) {
    super(
      {
        code,
        message,
        details,
      },
      status,
    );
  }
}

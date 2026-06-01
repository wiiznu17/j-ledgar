import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCode } from '@repo/dto';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockRequest = {
      url: '/test-path',
      method: 'POST',
      id: 'trace-1234',
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };
  });

  it('should format standard HttpException correctly', () => {
    const exception = new HttpException('Bad Request Message', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: HttpStatus.BAD_REQUEST,
          message: 'Bad Request Message',
        },
      }),
    );
  });

  it('should format custom BusinessException correctly', () => {
    const exception = new BusinessException(
      ErrorCode.FINANCE_INSUFFICIENT_BALANCE,
      'ยอดคงเหลือไม่พอสำหรับทำรายการ',
      HttpStatus.BAD_REQUEST,
      { balance: 100, required: 500 },
    );

    filter.catch(exception, mockHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: ErrorCode.FINANCE_INSUFFICIENT_BALANCE,
          message: 'ยอดคงเหลือไม่พอสำหรับทำรายการ',
          details: { balance: 100, required: 500 },
        },
      }),
    );
  });

  it('should handle validation pipe error message array correctly', () => {
    const exception = new HttpException(
      {
        message: ['phone must be valid', 'email must be valid'],
        error: 'Bad Request',
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'SYSTEM_VALIDATION_ERROR',
          message: 'Validation failed',
          details: ['phone must be valid', 'email must be valid'],
        },
      }),
    );
  });

  it('should handle generic server errors correctly', () => {
    const exception = new Error('Database crash!');

    filter.catch(exception, mockHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database crash!',
        },
      }),
    );
  });
});

import { HttpExceptionFilter } from './http-exception.filter';
import { ArgumentsHost, BadRequestException, NotFoundException } from '@nestjs/common';

describe('HttpExceptionFilter (PRD Section 2.5.9 & Security)', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    jest.spyOn((filter as any).logger, 'error').mockImplementation(() => {});
    jest.spyOn((filter as any).logger, 'warn').mockImplementation(() => {});

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockRequest = {
      method: 'GET',
      url: '/api/v1/products/123',
      headers: {
        'x-request-id': 'test-req-id-123',
      },
    };
    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;
  });

  it('should format 404 NotFoundException into consistent error envelope', () => {
    const exception = new NotFoundException('Product with ID "123" not found');

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        message: 'Product with ID "123" not found',
        code: 'Not Found',
      },
    });
  });

  it('should format 400 BadRequestException with validation details', () => {
    const validationErrors = ['category must be a valid enum value', 'page must be >= 1'];
    const exception = new BadRequestException({
      message: validationErrors,
      error: 'Bad Request',
      statusCode: 400,
    });

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        message: 'category must be a valid enum value; page must be >= 1',
        code: 'Bad Request',
        details: validationErrors,
      },
    });
  });

  it('should sanitize raw unhandled error to prevent leaking DB errors or stack traces', () => {
    const unhandledError = new Error('FATAL: connection to server on socket "/tmp/.s.PGSQL.5432" failed');

    filter.catch(unhandledError, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect((filter as any).logger.error).toHaveBeenCalled();
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        message: 'An unexpected error occurred. Please try again later.',
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  });
});

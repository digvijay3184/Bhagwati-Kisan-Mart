import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../dto/api-response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request.headers['x-request-id'] as string) || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: Record<string, any> | string[] | undefined = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resObj = exceptionResponse as Record<string, any>;
        message = resObj['message']
          ? Array.isArray(resObj['message'])
            ? resObj['message'].join('; ')
            : resObj['message']
          : exception.message;

        code = resObj['error'] || exception.name;

        // If class-validator provided array of error messages
        if (Array.isArray(resObj['message'])) {
          details = resObj['message'];
        }
      }
    } else {
      // Unhandled / system / database exception: Never leak raw error or stack trace to client
      this.logger.error(
        `[RequestID: ${requestId}] Unhandled Exception on ${request.method} ${request.url}: ${
          exception instanceof Error ? exception.stack : JSON.stringify(exception)
        }`,
      );
      message = 'An unexpected error occurred. Please try again later.';
      code = 'INTERNAL_SERVER_ERROR';
    }

    // Operational logging for non-500 or warning
    if (status >= 500) {
      this.logger.error(
        `[RequestID: ${requestId}] ${status} ${request.method} ${request.url} - ${message}`,
      );
    } else {
      this.logger.warn(
        `[RequestID: ${requestId}] ${status} ${request.method} ${request.url} - ${message}`,
      );
    }

    const errorPayload: ApiErrorResponse = {
      success: false,
      data: null,
      error: {
        message,
        code,
        ...(details ? { details } : {}),
      },
    };

    response.status(status).json(errorPayload);
  }
}

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, originalUrl } = request;
    const requestId = (request.headers['x-request-id'] as string) || 'unknown';
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const { statusCode } = response;
        const duration = Date.now() - startTime;
        this.logger.log(
          JSON.stringify({
            requestId,
            method,
            path: originalUrl,
            statusCode,
            durationMs: duration,
          }),
        );
      }),
    );
  }
}

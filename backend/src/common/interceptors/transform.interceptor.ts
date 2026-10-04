import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccessResponse } from '../dto/api-response.dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If already structured with success flag, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        return {
          success: true,
          data: data !== undefined ? data : null,
          error: null,
        };
      }),
    );
  }
}

import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import type { SuccessResponse } from '../interfaces/response.interface';
import { map } from 'rxjs/operators';

// The ResponseInterceptor acts as a universal response formatter,
// ensuring every API response follows the same contract while preserving
// special cases like pagination and providing useful metadata like performance
// timing.
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    return next.handle().pipe(
      map((data) => {
        const duration = Date.now() - startTime;
        // If data is already formatted (e.g., from pagination)
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'total' in data
        ) {
          return {
            success: true,
            data: data.data,
            meta: {
              timestamp: new Date().toISOString(),
              path: request.url,
              method: request.method,
              duration,
              pagination: {
                total: data.total,
                page: data.page || 1,
                limit: data.limit || 10,
                has_next: data.page * data.limit < data.total,
              },
            },
          } as SuccessResponse<T>;
        }
        // Standard response format
        return {
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            duration,
          },
        } as SuccessResponse<T>;
      }),
    );
  }
}

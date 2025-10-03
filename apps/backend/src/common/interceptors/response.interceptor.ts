import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  path: string;
  data: T;
  duration?: number;
  timestamp: string;
}

// The ResponseInterceptor acts as a universal response formatter,
// ensuring every API response follows the same contract while preserving
// special cases like pagination and providing useful metadata like performance
// timing.
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    return next.handle().pipe(
      map((data) => {
        const duration = Date.now() - startTime;
        const formatResponse = (data) => ({
          ...data,
          success: true,
          path: request.url,
          duration,
          timestamp: new Date().toISOString(),
        });
        // If data is already formatted return as is (e.g., from pagination)
        return formatResponse(
          data && typeof data === 'object' && 'data' in data && 'total' in data
            ? data
            : { data },
        );
      }),
    );
  }
}

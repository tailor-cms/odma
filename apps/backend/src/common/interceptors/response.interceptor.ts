import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler } from '@nestjs/common';
import {
  Injectable,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  path: string;
  data: T;
  duration?: number;
  timestamp: string;
}

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
          success: true,
          ...data,
          path: request.url,
          duration,
          timestamp: new Date().toISOString(),
        });
        // If data is already formatted (e.g., from pagination)
        // return as is
        return formatResponse(
          data && typeof data === 'object' && 'data' in data && 'total' in data
            ? data
            : { data },
        );
      }),
    );
  }
}

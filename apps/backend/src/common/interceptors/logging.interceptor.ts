import type {
  CallHandler,
  NestInterceptor,
  ExecutionContext,
} from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { PinoLogger } from 'nestjs-pino';
import { sanitizeUser } from '../utils/sanitize-user.util';
import { sanitizeRequestBody } from '../utils/sanitize-request-body.util';
import { tap } from 'rxjs/operators';

// The LoggingInterceptor essentially provides comprehensive request/response
// audit logging for every API call
//
// Execution Order:
// 1. 🟢 LoggingInterceptor.intercept() - "Request started"
// 2. 🛡️ ThrottlerGuard - Rate limiting check
// 3. 🔐 JwtAuthGuard - Authentication
// 4. 🎯 Controller method execution
// 5. 📊 ResponseInterceptor - Format response
// 6. 🟢 LoggingInterceptor.tap() - "Request completed"
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user, ip } = request;
    const startTime = Date.now();
    // Sanitize sensitive data before logging
    const sanitizedBody = sanitizeRequestBody(body);
    const sanitizedUser = sanitizeUser(user);
    // Structured logging for incoming request
    this.logger.info('Request started', {
      method,
      url,
      ip,
      userAgent: request.get('User-Agent'),
      user: sanitizedUser,
      body: Object.keys(body || {}).length ? sanitizedBody : undefined,
    });
    return next.handle().pipe(
      tap({
        next: (_data) => {
          const response = context.switchToHttp().getResponse();
          const responseTime = Date.now() - startTime;
          this.logger.info('Request completed', {
            method,
            url,
            statusCode: response.statusCode,
            responseTime,
            user: sanitizedUser,
          });
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          this.logger.error('Request failed', {
            method,
            url,
            statusCode: error.status || 500,
            responseTime,
            error: error.message,
            user: sanitizedUser,
          });
        },
      }),
    );
  }
}

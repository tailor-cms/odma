import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor } from '@nestjs/common';
import {
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { sanitizeUser } from '../utils/sanitize-user.util';
import { sanitizeRequestBody } from '../utils/sanitize-request-body.util';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const now = Date.now();

    // Sanitize sensitive data before logging
    const sanitizedBody = sanitizeRequestBody(body);
    const sanitizedUser = sanitizeUser(user);

    this.logger.log(
      `Incoming Request: ${method} ${url}${
        Object.keys(body || {}).length
          ? ` - Body: ${JSON.stringify(sanitizedBody)}`
          : ''
      }${sanitizedUser?.id ? ` - User: ${JSON.stringify(sanitizedUser)}` : ''}`,
    );

    return next.handle().pipe(
      tap({
        next: (_data) => {
          const response = context.switchToHttp().getResponse();
          const delay = Date.now() - now;
          const msg = `${method} ${url} - ${response.statusCode} - ${delay}ms`;
          this.logger.log(`Outgoing Response: ${msg}`);
        },
        error: (error) => {
          const delay = Date.now() - now;
          const base = `${method} ${url} - ${error.status || 500} - ${delay}ms`;
          this.logger.error(`Error Response: ${base} - ${error.message}`);
        },
      }),
    );
  }
}

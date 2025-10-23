import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Catch } from '@nestjs/common';
import { ErrorTypes } from '../constants/error-codes';
import type { ErrorResponse } from '../interfaces/response.interface';
import { PinoLogger } from 'nestjs-pino';
import { ThrottlerException } from '@nestjs/throttler';
import { sanitizeUser } from '../utils/sanitize-user.util';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(ThrottlerExceptionFilter.name);
  }

  catch(_exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const sanitizedUser = sanitizeUser(request.user);
    const userAgent = request.get('User-Agent');
    const endpoint = `${request.method} ${request.url}`;
    // Calculate retry-after based on TTL (60 seconds from config)
    const retryAfter = 60;
    // Log rate limit violation with security context
    this.logger.warn('Rate limit exceeded', {
      user: sanitizedUser,
      ip: request.ip,
      userAgent,
      endpoint,
      retryAfter,
      // Security flags
      suspiciousActivity: this.detectSuspiciousActivity(request),
      highFrequency: true, // By definition, if throttled
    });
    // Set standard rate limit headers
    response.set('Retry-After', retryAfter.toString());
    response.set('X-RateLimit-Limit', '100');
    response.set('X-RateLimit-Remaining', '0');
    response.set(
      'X-RateLimit-Reset',
      Math.ceil(Date.now() / 1000 + retryAfter).toString(),
    );
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        type: ErrorTypes.RATE_LIMIT,
        message: 'Too many requests, please try again later',
        details: [
          {
            retryAfter,
            limitInfo: { limit: 100, window: '60 seconds' },
            suspicious: this.detectSuspiciousActivity(request),
          },
        ],
      },
      meta: {
        statusCode: 429,
        path: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
        duration: 0, // Not available in exception context
      },
    };
    return response.status(429).json(errorResponse);
  }

  private detectSuspiciousActivity(request: Request): boolean {
    const userAgent = request.get('User-Agent') || '';
    // Flag potential automated/bot activity
    const botPatterns = /bot|crawler|spider|scraper|curl|wget|postman/i;
    const missingUserAgent = !userAgent;
    const shortUserAgent = userAgent.length < 10;
    return botPatterns.test(userAgent) || missingUserAgent || shortUserAgent;
  }
}

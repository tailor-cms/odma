import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ErrorResponse } from '../interfaces/response.interface';
import { ErrorTypes } from '../constants/error-codes';
import { PinoLogger } from 'nestjs-pino';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import { formatDevelopmentDetails } from '../utils/format-error-details.util';
import { sanitizeRequestBody } from '../utils/sanitize-request-body.util';
import { sanitizeUser } from '../utils/sanitize-user.util';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isErrorInstance = exception instanceof Error;
    // Handle non-HTTP exceptions (database errors, network errors, etc.)
    // Note: HttpExceptions should already be handled by more specific filters
    // Don't expose internal error details in production
    // Sanitize user data for logging
    const sanitizedUser = sanitizeUser(request.user);
    const sanitizedBody = sanitizeRequestBody(request.body);
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      isErrorInstance && !isProduction
        ? exception.message
        : 'Internal server error';
    const desc = `${request.method} ${request.url} - ${status} - ${message}`;
    this.logger.error(`Unhandled Exception: ${desc}`, {
      user: sanitizedUser,
      body: sanitizedBody,
      stack: isErrorInstance ? exception.stack : undefined,
      error: isErrorInstance ? exception.message : String(exception),
    });
    const details =
      isDevelopment && isErrorInstance
        ? formatDevelopmentDetails(exception)
        : undefined;
    const errorResponse: ErrorResponse = {
      success: false,
      error: { type: ErrorTypes.INTERNAL, message, details },
      meta: {
        path: request.url,
        method: request.method,
        statusCode: status,
        timestamp: new Date().toISOString(),
        duration: 0, // Not available in exception context
      },
    };
    return response.status(status).json(errorResponse);
  }
}

import type {
  ArgumentsHost,
  ExceptionFilter } from '@nestjs/common';
import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { sanitizeUser } from '../utils/sanitize-user.util';
import { sanitizeRequestBody } from '../utils/sanitize-request-body.util';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Skip HttpExceptions and BadRequestExceptions as they're
    // handled by specific filters
    if (
      exception instanceof BadRequestException ||
      exception instanceof HttpException
    ) {
      throw exception;
    }

    // Handle non-HTTP exceptions (database errors, network errors, etc.)
    if (exception instanceof Error) {
      message = exception.message;
      // Don't expose internal error details in production
      if (process.env.NODE_ENV === 'production') {
        message = 'Internal server error';
      }
    }

    // Sanitize user data for logging
    const sanitizedUser = sanitizeUser(request.user);
    const sanitizedBody = sanitizeRequestBody(request.body);

    this.logger.error(
      `Unhandled Exception: ${request.method} ${request.url} - ${status} - ${message}`,
      {
        user: sanitizedUser,
        body: sanitizedBody,
        stack: exception instanceof Error ? exception.stack : undefined,
        error:
          exception instanceof Error ? exception.message : String(exception),
      },
    );

    return response.status(status).json({
      success: false,
      path: request.url,
      method: request.method,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
        originalError:
          exception instanceof Error ? exception.message : String(exception),
      }),
    });
  }
}

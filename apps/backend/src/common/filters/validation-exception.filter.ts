import type {
  ArgumentsHost,
  ExceptionFilter } from '@nestjs/common';
import {
  BadRequestException,
  Catch,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { sanitizeUser } from '../utils/sanitize-user.util';
import { sanitizeRequestBody } from '../utils/sanitize-request-body.util';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let errors = [] as any[];
    const exceptionResponse = exception.getResponse() as any;
    if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
      errors = exceptionResponse.message;
    } else if (typeof exceptionResponse.message === 'string') {
      errors = [exceptionResponse?.message];
    }

    // Sanitize user data for logging
    const sanitizedUser = sanitizeUser(request.user);
    const sanitizedBody = sanitizeRequestBody(request.body);

    this.logger.warn(
      `Validation Error: ${request.method} ${request.url} - ${JSON.stringify(errors)}`,
      { user: sanitizedUser, body: sanitizedBody },
    );

    const statusCode = exception.getStatus();
    return response.status(statusCode).json({
      success: false,
      statusCode,
      path: request.url,
      method: request.method,
      message: 'Validation failed',
      errors,
      timestamp: new Date().toISOString(),
    });
  }
}

import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { BadRequestException, Catch } from '@nestjs/common';
import { ErrorTypes } from '../constants/error-codes';
import type { ErrorResponse } from '../interfaces/response.interface';
import type { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { sanitizeUser } from '../utils/sanitize-user.util';
import { sanitizeRequestBody } from '../utils/sanitize-request-body.util';
import { formatValidationDetails } from '../utils/format-error-details.util';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(ValidationExceptionFilter.name);
  }

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const statusCode = exception.getStatus();
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
    this.logger.warn(`Validation Error: ${request.method} ${request.url}`, {
      user: sanitizedUser,
      body: sanitizedBody,
      validationErrors: errors,
    });
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        type: ErrorTypes.VALIDATION,
        message: 'Request validation failed',
        details: formatValidationDetails(errors),
      },
      meta: {
        statusCode,
        path: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
        duration: 0, // Not available in exception context
      },
    };
    return response.status(statusCode).json(errorResponse);
  }
}

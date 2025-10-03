import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ErrorResponse } from '../interfaces/response.interface';
import { PinoLogger } from 'nestjs-pino';
import { formatErrorDetails } from '../utils/format-error-details.util';
import { getErrorType } from '../constants/error-codes';
import { sanitizeRequestBody } from '../utils/sanitize-request-body.util';
import { sanitizeUser } from '../utils/sanitize-user.util';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(HttpExceptionFilter.name);
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const statusCode = exception.getStatus();
    const errorType = getErrorType(statusCode);
    const exceptionResponse = exception.getResponse();
    const exceptionInfo =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : (exceptionResponse as any);
    // Sanitize user data for logging
    const sanitizedUser = sanitizeUser(request.user);
    const sanitizedBody = sanitizeRequestBody(request.body);
    const message = exceptionInfo.message || 'HTTP Exception';
    this.logger.error(
      `HTTP Exception: ${request.method} ${request.url} ${statusCode}`,
      {
        statusCode,
        errorType,
        user: sanitizedUser,
        body: sanitizedBody,
        message,
      },
    );
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        type: errorType,
        message,
        details: exceptionInfo.error
          ? formatErrorDetails(exceptionInfo)
          : undefined,
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        duration: 0, // Not available in exception context
        statusCode,
      },
    };
    return response.status(statusCode).json(errorResponse);
  }
}

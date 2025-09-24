import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { sanitizeUser } from '../utils/sanitize-user.util';
import { sanitizeRequestBody } from '../utils/sanitize-request-body.util';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const exceptionResponse = exception.getResponse();

    const error =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : (exceptionResponse as object);

    // Sanitize user data for logging
    const sanitizedUser = sanitizeUser(request.user);
    const sanitizedBody = sanitizeRequestBody(request.body);

    const statusCode = exception.getStatus();
    this.logger.error(
      `HTTP Exception: ${request.method} ${request.url} - ${statusCode} - ${JSON.stringify(error)}`,
      { user: sanitizedUser, body: sanitizedBody },
    );

    return response.status(statusCode).json({
      success: false,
      statusCode,
      path: request.url,
      method: request.method,
      ...error,
      timestamp: new Date().toISOString(),
    });
  }
}

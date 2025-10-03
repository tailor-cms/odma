import { Module, Global } from '@nestjs/common';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { ThrottlerExceptionFilter } from './filters/throttler-exception.filter';
import { ValidationExceptionFilter } from './filters/validation-exception.filter';

@Global()
@Module({
  providers: [
    // Note: Some of these are registered globally in main.ts
    // Keeping them here for module completeness
    AllExceptionsFilter,
    HttpExceptionFilter,
    LoggingInterceptor,
    ResponseInterceptor,
    ThrottlerExceptionFilter,
    ValidationExceptionFilter,
  ],
  exports: [
    AllExceptionsFilter,
    HttpExceptionFilter,
    LoggingInterceptor,
    ResponseInterceptor,
    ThrottlerExceptionFilter,
    ValidationExceptionFilter,
  ],
})
export class CommonModule {}

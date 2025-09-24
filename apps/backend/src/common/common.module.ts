import { Module, Global } from '@nestjs/common';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
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
    ValidationExceptionFilter,
  ],
  exports: [
    AllExceptionsFilter,
    HttpExceptionFilter,
    LoggingInterceptor,
    ResponseInterceptor,
    ValidationExceptionFilter,
  ],
})
export class CommonModule {}

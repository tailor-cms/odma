import { HttpStatus } from '@nestjs/common';

// Simple error types for categorizing errors
export const ErrorTypes = {
  VALIDATION: 'Validation',
  AUTHENTICATION: 'Authentication',
  AUTHORIZATION: 'Authorization',
  RATE_LIMIT: 'RateLimit',
  INTERNAL: 'Internal',
  HTTP: 'Http',
} as const;

export type ErrorType = (typeof ErrorTypes)[keyof typeof ErrorTypes];

// Properly classify error types based on HTTP status
export const getErrorType = (status: number): string => {
  if ([HttpStatus.UNAUTHORIZED].includes(status)) {
    return ErrorTypes.AUTHENTICATION;
  }
  if ([HttpStatus.FORBIDDEN].includes(status)) {
    return ErrorTypes.AUTHORIZATION;
  }
  if (
    [HttpStatus.BAD_REQUEST, HttpStatus.UNPROCESSABLE_ENTITY].includes(status)
  ) {
    return ErrorTypes.VALIDATION;
  }
  if ([HttpStatus.TOO_MANY_REQUESTS].includes(status)) {
    return ErrorTypes.RATE_LIMIT;
  }
  if (status >= 500) {
    return ErrorTypes.INTERNAL;
  }
  return ErrorTypes.HTTP;
};

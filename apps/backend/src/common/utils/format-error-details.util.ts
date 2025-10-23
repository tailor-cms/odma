/**
 * Standardizes error detail formatting across all exception filters
 */
export function formatErrorDetails(details: any): any[] | undefined {
  if (!details) {
    return undefined;
  }
  // If already an array, return as-is
  if (Array.isArray(details)) {
    return details;
  }
  // If it's an object, wrap in array
  if (typeof details === 'object') {
    return [details];
  }
  // If it's a string, wrap in array
  if (typeof details === 'string') {
    return [details];
  }
  // Fallback
  return [details];
}

/**
 * Creates standardized validation error details
 */
export function formatValidationDetails(validationErrors: any[]): any[] {
  if (!validationErrors || !Array.isArray(validationErrors)) {
    return [];
  }
  return validationErrors.map((error) => {
    if (typeof error === 'string') {
      return { message: error };
    }
    if (typeof error === 'object' && error.message) {
      return { message: error.message, field: error.property };
    }
    return { message: String(error) };
  });
}

/**
 * Creates standardized development error details
 */
export function formatDevelopmentDetails(exception: Error): any[] {
  return [{
    stack: exception.stack,
    name: exception.name,
    message: exception.message,
  }];
}

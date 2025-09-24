/**
 * Sanitizes request body for logging purposes by masking sensitive fields
 * at any depth. Handles nested objects, arrays, and circular references safely.
 */
export function sanitizeRequestBody(body: any, visited = new WeakSet()): any {
  // Handle primitives and null/undefined
  if (body === null || body === undefined || typeof body !== 'object') {
    return body;
  }

  // Prevent infinite recursion with circular references
  if (visited.has(body)) {
    return '[Circular Reference]';
  }
  visited.add(body);

  // Handle Arrays
  if (Array.isArray(body)) {
    return body.map(item => sanitizeRequestBody(item, visited));
  }

  // Handle Date objects
  if (body instanceof Date) {
    return body.toISOString();
  }

  // Handle other special objects (RegExp, etc.)
  if (body.constructor !== Object) {
    return '[Object: ' + body.constructor.name + ']';
  }

  // Handle plain objects
  const sanitized: any = {};

  // All potentially sensitive field names (including common variations)
  const sensitiveFields = new Set([
    'password',
    'currentPassword',
    'newPassword',
    'oldPassword',
    'confirmPassword',
    'passwordConfirmation',
    'refreshToken',
    'jwt',
    'token',
    'accessToken',
    'idToken',
    'authToken',
    'bearerToken',
    'sessionToken',
    'csrfToken',
    'secret',
    'clientSecret',
    'apiSecret',
    'privateKey',
    'publicKey',
    'apiKey',
    'sessionId',
    'cookie',
    'cookies',
    'authorization',
    'auth',
    'credentials',
    'credit_card',
    'creditCard',
    'card_number',
    'cardNumber',
    'cvv',
    'cvc',
    'pin',
    'ssn',
    'oib',
    'social_security',
    'socialSecurity',
    'passport',
    'license',
    'driverLicense'
  ]);

  for (const key in body) {
    if (!body.hasOwnProperty(key)) continue;
    const lowerKey = key.toLowerCase();
    // Check if field name contains sensitive keywords
    const isSensitive = sensitiveFields.has(lowerKey) ||
      lowerKey.includes('password') ||
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('key') ||
      lowerKey.includes('auth') ||
      lowerKey.includes('credential');
    if (isSensitive) {
      sanitized[key] = '[MASKED]';
    } else {
      // Recursively sanitize nested objects/arrays
      sanitized[key] = sanitizeRequestBody(body[key], visited);
    }
  }

  return sanitized;
}

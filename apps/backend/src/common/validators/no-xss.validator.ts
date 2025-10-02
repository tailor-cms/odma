import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

const xssValidator = (value: any, _args: ValidationArguments) => {
  if (typeof value !== 'string') return true;
  // Check for common XSS patterns
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=, onerror=
    /<img[^>]+src[\\s]*=[\\s]*["\']javascript:/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  ];
  for (const pattern of xssPatterns) {
    if (pattern.test(value)) return false;
  }
  // Check for HTML tags (optional - stricter validation)
  const htmlPattern = /<[^>]+>/g;
  if (htmlPattern.test(value)) return false;
  return true;
};

// Custom validator to prevent XSS attacks by rejecting HTML/script content
export function NoXSS(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'noXSS',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate: xssValidator,
        defaultMessage(args: ValidationArguments) {
          return `${args.property} contains potentially dangerous content`;
        },
      },
    });
  };
}

// Transform decorator to sanitize input by removing HTML tags
export function SanitizeHTML() {
  return function (target: any, propertyName: string) {
    const descriptor = Object.getOwnPropertyDescriptor(target, propertyName);
    Object.defineProperty(target, propertyName, {
      get: descriptor?.get,
      set(value: any) {
        if (typeof value === 'string') {
          // Remove HTML tags
          value = value.replace(/<[^>]*>/g, '');
          // Decode HTML entities
          value = value
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, '\'')
            .replace(/&#x2F;/g, '/');
        }
        descriptor?.set?.call(this, value);
      },
      enumerable: true,
      configurable: true,
    });
  };
}

import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

const dataUrlValidator = (value: any, _args: ValidationArguments) => {
  if (typeof value !== 'string') return false;

  // Allow empty string to remove current image
  if (value === '') return true;

  // Check if it's a valid data URL format
  const dataUrlPattern =
    /^data:([a-zA-Z0-9][a-zA-Z0-9\/+]*);base64,([A-Za-z0-9+/=]+)$/;
  if (!dataUrlPattern.test(value)) return false;

  // Extract the MIME type
  const match = value.match(/^data:([^;]+);base64,/);
  if (!match) return false;

  const mimeType = match[1];

  // Only allow image MIME types
  const allowedImageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
  ];
  return allowedImageTypes.includes(mimeType.toLowerCase());
};

// Custom validator for data URLs (specifically image data URLs)
export function IsDataUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDataUrl',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate: dataUrlValidator,
        defaultMessage(args: ValidationArguments) {
          const msg =
            'must be a valid image data URL or empty string to remove image';
          return `${args.property} ${msg}`;
        },
      },
    });
  };
}

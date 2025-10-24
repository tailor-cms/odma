import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

export function generateOpenApiDocument(app: INestApplication) {
  const apiDocConfig = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('me', 'Current user profile endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, apiDocConfig, {
    operationIdFactory: (ctrl: string, method: string) => {
      return `${ctrl.replaceAll('Controller', '')}_${method}`;
    },
  });
  return document;
}

export function saveOpenApiSpec(document: any) {
  const openApiPath = join(process.cwd(), 'openapi.json');
  try {
    writeFileSync(openApiPath, JSON.stringify(document, null, 2));
    console.log(`📄 OpenAPI spec saved to: ${openApiPath}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  Could not save OpenAPI spec to file:`, error.message);
    return false;
  }
}

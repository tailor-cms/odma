import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { NestFactory, Reflector } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { generateOpenApiDocument, saveOpenApiSpec } from './utils/openapi';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const reflector = app.get(Reflector);
  app.useLogger(app.get(Logger));
  app.use(cookieParser(config.get<string>('auth.jwt.secret')));
  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({
    origin: config.get<string[]>('corsAllowedOrigins'),
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      validateCustomDecorators: true,
    }),
  );
  app.useGlobalInterceptors(
    app.get(LoggingInterceptor),
    new ClassSerializerInterceptor(reflector, {
      excludeExtraneousValues: false,
      enableImplicitConversion: false,
      strategy: 'exposeAll',
    }),
    new ResponseInterceptor(),
  );
  // Registered in reverse order of execution
  // Order: Most specific → Most general
  app.useGlobalFilters(
    app.get(AllExceptionsFilter), // 4th: Catch-all for non-HTTP exceptions
    app.get(HttpExceptionFilter), // 3rd: General HTTP exceptions
    app.get(ValidationExceptionFilter), // 2nd: BadRequestException (validation)
    app.get(ThrottlerExceptionFilter), // 1st: ThrottlerException
  );
  if (!config.get<string>('isProduction')) {
    const document = generateOpenApiDocument(app);
    // Save OpenAPI spec to file
    // for offline access and build-time client generation
    saveOpenApiSpec(document);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
    });
  }
  // Set config cookie
  app.use((req, res, next) => {
    if (req.path === '/' || req.path === '/index.html') {
      const configCookie = JSON.stringify(
        Object.fromEntries(
          Object.entries(process.env).filter(([key]) =>
            key.startsWith('NUXT_PUBLIC_'),
          ),
        ),
      );
      res.cookie('config', configCookie);
    }
    next();
  });
  const port = config.get<number>('port') as number;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();

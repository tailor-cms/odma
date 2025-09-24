import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestFactory, Reflector } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const reflector = app.get(Reflector);
  app.use(cookieParser(config.get<string>('auth.jwt.secret', 'cookie-secret')));
  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({
    origin: config.get<string[]>('corsAllowedOrigins'),
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      validateCustomDecorators: true,
    }),
  );
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector, {
      excludeExtraneousValues: false,
      enableImplicitConversion: false,
      strategy: 'exposeAll',
    }),
    new ResponseInterceptor(),
  );
  // Exception filters (registered in reverse order of execution)
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new HttpExceptionFilter(),
    new ValidationExceptionFilter(),
  );
  if (!config.get<string>('isProduction')) {
    const apiDocConfig = new DocumentBuilder()
      .setTitle('API')
      .setDescription('API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('health', 'Health check endpoints')
      .addTag('users', 'User management endpoints')
      .build();
    const document = SwaggerModule.createDocument(app, apiDocConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
    });
  }
  // Serve static files and set config cookie
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

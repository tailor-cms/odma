import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../../src/modules/mail/mail.service';
import { MikroORM } from '@mikro-orm/core';
import { TestAppModule } from '../test-app.module';
import { mockMailService } from './auth.spec.helpers';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { join } from 'path';

// Load test environment variables
dotenv.config({ path: join(__dirname, '../.env.test') });

let app: INestApplication;
let orm: MikroORM;
let jwtService: JwtService;
let configService: ConfigService;

export async function createTestingApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [TestAppModule],
  })
    .overrideProvider(MailService)
    .useValue(mockMailService)
    .compile();

  app = moduleFixture.createNestApplication();

  // Add cookie parser with secret for signed cookies
  // Use a test secret since we're in test environment
  app.use(cookieParser('test-cookie-secret'));

  // Set global prefix to match production
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validateCustomDecorators: true,
    }),
  );

  await app.init();

  // Store service instances
  orm = moduleFixture.get(MikroORM);
  jwtService = moduleFixture.get(JwtService);
  configService = moduleFixture.get(ConfigService);

  // Create schema
  try {
    await orm.schema.refreshDatabase();
  } catch (error) {
    // For LibSQL in-memory, the schema might already exist
    // Continue with the tests
    console.error('Schema refresh error:', error);
  }
  return app;
}

export async function closeTestingApp(): Promise<void> {
  if (orm) await orm.close(true);
  if (app) await app.close();
}

// Service getters
export function getOrm(): MikroORM {
  return orm;
}

export function getJwtService(): JwtService {
  return jwtService;
}

export function getConfigService(): ConfigService {
  return configService;
}

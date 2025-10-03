import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './modules/health/health.module';
import { LoggerModule } from 'nestjs-pino';
import { MailModule } from './modules/mail/mail.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { UserModule } from './modules/user/user.module';

import authConfig from './config/auth.config';
import dbConfig from './config/db.config';
import generalConfig from './config/general.config';
import { join } from 'path';
import mailConfig from './config/mail.config';
import mikroOrmConfig from './config/mikro-orm.config';
import pinoConfig from './config/lib/pino.config';
import { validationSchema } from './config/validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '../../.env',
      load: [authConfig, dbConfig, generalConfig, mailConfig, mikroOrmConfig],
      validationSchema,
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const isProd = config.get<boolean>('isProduction', { infer: true });
        const level = config.get<string>('logLevel', { infer: true });
        return pinoConfig(level, isProd);
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../..', 'frontend/.output/public'),
      exclude: ['/api*', '/api/**'],
      serveRoot: '/',
    }),
    MikroOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const mikroConfig = configService.get('mikroORM');
        const database = configService.get('database');
        const saltRounds = configService.get<number>('auth.saltRounds');
        return {
          ...mikroConfig,
          ...database,
          saltRounds,
        };
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    CommonModule,
    AuthModule,
    HealthModule,
    MailModule,
    UserModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

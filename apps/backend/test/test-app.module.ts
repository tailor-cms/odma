import { AuthModule } from '../src/modules/auth/auth.module';
import { CommonModule } from '../src/common/common.module';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from '../src/modules/health/health.module';
import { LoggerModule } from 'nestjs-pino';
import { MailModule } from '../src/modules/mail/mail.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { UserModule } from '../src/modules/user/user.module';

import authConfig from '../src/config/auth.config';
import generalConfig from '../src/config/general.config';
import mailConfig from '../src/config/mail.config';
import mikroOrmConfig from './mikro-orm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
      load: [authConfig, generalConfig, mailConfig],
    }),
    // Disable logging during tests
    LoggerModule.forRoot({
      pinoHttp: { level: 'silent' },
    }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    CommonModule,
    AuthModule,
    HealthModule,
    MailModule,
    UserModule,
  ],
})
export class TestAppModule {}

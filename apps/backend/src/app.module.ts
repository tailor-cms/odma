import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './modules/health/health.module';
import { MailModule } from './modules/mail/mail.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './modules/user/user.module';
import dbConfig, { DbConfig } from './config/db.config';
import authConfig from './config/auth.config';
import generalConfig from './config/general.config';
import { validationSchema } from './config/validation';
import mailConfig from './config/mail.config';
import mikroOrmConfig from './config/mikro-orm.config';

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
    MikroOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const mikroOrmConfig = configService.get<DbConfig>('mikroORM');
        const database = configService.get<DbConfig>('database');
        const saltRounds = configService.get<number>('auth.saltRounds');
        return {
          ...mikroOrmConfig,
          ...database,
          saltRounds,
        };
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    CommonModule,
    HealthModule,
    MailModule,
    UserModule,
  ],
})
export class AppModule {}

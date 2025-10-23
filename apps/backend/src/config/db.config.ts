import * as Joi from 'joi';
import yn from 'yn';
import { registerAs } from '@nestjs/config';

const env = process.env;

export const dbValidationSchema = {
  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_NAME: Joi.string().default('app'),
  DATABASE_USERNAME: Joi.string().default('dev'),
  DATABASE_PASSWORD: Joi.string().default('dev'),
  DATABASE_SSL: Joi.boolean().default(false),
  DATABASE_LOGGING: Joi.boolean().default(false),
};

export interface DbConfig {
  host: string;
  port: number;
  name: string;
  username: string;
  password: string;
  ssl: boolean;
  logging: boolean;
}

export default registerAs('database', () => ({
  host: env.DATABASE_HOST,
  port: parseInt(env.DATABASE_PORT as string, 10),
  user: env.DATABASE_USERNAME,
  password: env.DATABASE_PASSWORD,
  dbName: env.DATABASE_NAME,
  ssl: yn(env.DATABASE_SSL),
  debug: yn(env.DATABASE_LOGGING),
}));

import * as Joi from 'joi';
import { resolveOrigin } from '@app/config';

const env = process.env;

export const generalValidationSchema = {
  HOSTNAME: Joi.string().default('localhost'),
  PORT: Joi.number().default(3000),
  REVERSE_PROXY_PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  LOG_LEVEL: Joi.string()
    .valid('trace', 'debug', 'info', 'warn', 'error', 'fatal')
    .default('info'),
  CORS_ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),
  SENTRY_DSN: Joi.string().optional().allow(''),
};

export interface GeneralConfig {
  hostname: string;
  port: number;
  protocol: string;
  origin: string;
  nodeEnv: string;
  isProduction: boolean;
  logLevel: string;
  corsAllowedOrigins: string[];
  sentryDsn?: string;
}

export default () => {
  const { protocol, port, hostname, origin } = resolveOrigin(env);
  return {
    origin,
    hostname,
    port,
    protocol,
    nodeEnv: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    logLevel: env.LOG_LEVEL,
    corsAllowedOrigins: (env.CORS_ALLOWED_ORIGINS as string)
      .split(',')
      .filter((s) => s)
      .map((s) => s.trim()),
    sentryDsn: env.SENTRY_DSN,
  };
};

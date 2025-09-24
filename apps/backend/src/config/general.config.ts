import * as Joi from 'joi';

const env = process.env;

export const generalValidationSchema = {
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  CORS_ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),
};

export interface GeneralConfig {
  port: number;
  nodeEnv: string;
  isProduction: boolean;
  corsAllowedOrigins: string[];
}

export default () => ({
  port: parseInt(env.PORT as string, 10),
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  corsAllowedOrigins: (env.CORS_ALLOWED_ORIGINS as string)
    .split(',')
    .filter((s) => s)
    .map((s) => s.trim()),
});

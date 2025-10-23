import * as Joi from 'joi';
import ms from 'ms';
import { registerAs } from '@nestjs/config';

const env = process.env;

export const authValidationSchema = {
  AUTH_SALT_ROUNDS: Joi.number().default(10),
  AUTH_JWT_ISSUER: Joi.string().default('App'),
  AUTH_JWT_SECRET: Joi.string().default('auth-jwt-secret'),
  AUTH_JWT_EXPIRES_IN: Joi.string().default('7d'),
  AUTH_COOKIE_NAME: Joi.string().default('access_token'),
};

export interface JwtConfig {
  issuer: string;
  secret: string;
  expiresInMs: number;
}

export interface JwtCookieConfig {
  name: string;
  signed: boolean;
  secure: boolean;
  httpOnly: boolean;
}

export interface AuthConfig {
  saltRounds: number;
  jwt: JwtConfig;
  cookie: JwtCookieConfig;
}

export default registerAs('auth', () => ({
  saltRounds: parseInt(env.AUTH_SALT_ROUNDS as string, 10),
  jwt: {
    issuer: env.AUTH_JWT_ISSUER,
    secret: env.AUTH_JWT_SECRET,
    expiresInMs: ms(env.AUTH_JWT_EXPIRES_IN),
  },
  cookie: {
    name: env.AUTH_COOKIE_NAME,
    httpOnly: true,
    secure: true,
    signed: true,
  },
}));

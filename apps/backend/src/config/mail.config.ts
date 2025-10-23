import * as Joi from 'joi';
import yn from 'yn';
import { registerAs } from '@nestjs/config';

const env = process.env;

export const mailValidationSchema = {
  MAIL_HOST: Joi.string().default('email-smtp.us-east-1.amazonaws.com'),
  MAIL_PORT: Joi.number().default(null),
  MAIL_USER: Joi.string().allow(''),
  MAIL_PASSWORD: Joi.string().allow(''),
  MAIL_SECURE: Joi.boolean().default(false),
  MAIL_FROM_NAME: Joi.string().default('App'),
  MAIL_FROM_EMAIL: Joi.string().email().default('noreply@example.com'),
};

export interface MailConfig {
  host: string;
  port?: number;
  secure: boolean;
  auth: {
    user?: string;
    pass?: string;
  };
  from: {
    name: string;
    email: string;
  };
}

export default registerAs('mail', () => ({
  host: env.MAIL_HOST,
  port: parseInt(env.MAIL_PORT as string, 10),
  secure: yn(env.MAIL_SECURE),
  auth: {
    user: env.MAIL_USER,
    pass: env.MAIL_PASSWORD,
  },
  from: {
    name: env.MAIL_FROM_NAME || 'App Starter',
    email: env.MAIL_FROM_EMAIL || 'noreply@appstarter.com',
  },
}));

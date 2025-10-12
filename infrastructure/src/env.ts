import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import type * as studion from '@studion/infra-code-blocks';

const awsConfig = new pulumi.Config('aws');
const mailConfig = new pulumi.Config('mail');
const dnsConfig = new pulumi.Config('dns');
const ssmConfig = new pulumi.Config('ssm');
const accountId = aws.getCallerIdentityOutput().accountId;

function getSsmParam(key: string) {
  const region = awsConfig.require('region');
  const prefix = ssmConfig.require('keyPrefix');
  const baseArn = `arn:aws:ssm:${region}`;
  return pulumi.interpolate`${baseArn}:${accountId}:parameter/${prefix}/${key}`;
}

export const getEnvVariables = (db: studion.Database) => [
  // General configuration
  { name: 'NODE_ENV', value: 'production' },
  { name: 'LOG_LEVEL', value: 'info' },
  { name: 'HOSTNAME', value: dnsConfig.require('domain') },
  { name: 'PORT', value: '3000' },
  { name: 'REVERSE_PROXY_PORT', value: '443' },
  {
    name: 'CORS_ALLOWED_ORIGINS',
    value: `https://${dnsConfig.require('domain')}`,
  },
  // Database configuration
  { name: 'DATABASE_HOST', value: db.instance.address },
  {
    name: 'DATABASE_PORT',
    value: db.instance.port.apply((port: number) => String(port)),
  },
  { name: 'DATABASE_NAME', value: db.instance.dbName },
  { name: 'DATABASE_USERNAME', value: db.instance.username },
  { name: 'DATABASE_SSL', value: 'true' },
  { name: 'DATABASE_LOGGING', value: 'false' },
  // Authentication configuration
  { name: 'AUTH_JWT_ISSUER', value: 'App' },
  { name: 'AUTH_JWT_EXPIRES_IN', value: '7d' },
  { name: 'AUTH_COOKIE_NAME', value: 'access_token' },
  { name: 'AUTH_SALT_ROUNDS', value: '12' },
  // Mail configuration
  { name: 'MAIL_HOST', value: mailConfig.require('host') },
  { name: 'MAIL_PORT', value: '587' },
  { name: 'MAIL_SECURE', value: 'true' },
  { name: 'MAIL_FROM_NAME', value: 'App' },
  { name: 'MAIL_FROM_EMAIL', value: mailConfig.require('senderAddress') },
];

export const getSecrets = (db: studion.Database) => [
  ...[
    'AUTH_JWT_SECRET',
    'MAIL_USER',
    'MAIL_PASSWORD',
    'SENTRY_DSN',
  ].map((name) => ({ name, valueFrom: getSsmParam(name) })),
  { name: 'DATABASE_PASSWORD', valueFrom: db.password.secret.arn },
];

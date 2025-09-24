import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import mikroOrmConfig from './src/config/mikro-orm.config';
import dbConfig from './src/config/db.config';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Since the configs use registerAs, we need to call the returned function
// The registerAs function returns a factory function
const mikroConfigFactory = mikroOrmConfig as any;
const dbConfigFactory = dbConfig as any;

const mikroConfig =
  typeof mikroConfigFactory === 'function'
    ? mikroConfigFactory()
    : mikroConfigFactory;

const databaseConfig =
  typeof dbConfigFactory === 'function' ? dbConfigFactory() : dbConfigFactory;

export default defineConfig({
  driver: PostgreSqlDriver,
  ...mikroConfig,
  ...databaseConfig,
} as Parameters<typeof defineConfig>[0]);

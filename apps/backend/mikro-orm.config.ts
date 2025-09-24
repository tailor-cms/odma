import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import mikroOrmConfig from './src/config/mikro-orm.config';
import dbConfig from './src/config/db.config';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Get the config functions
const mikroConfig = mikroOrmConfig();
const databaseConfig = dbConfig();

// Export using defineConfig for proper typing and validation
export default defineConfig({
  driver: PostgreSqlDriver,
  ...mikroConfig,
  ...databaseConfig,
} as Parameters<typeof defineConfig>[0]);

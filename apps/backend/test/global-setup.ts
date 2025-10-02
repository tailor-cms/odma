import * as dotenv from 'dotenv';
import { join } from 'path';

export default async () => {
  // Load test environment variables
  dotenv.config({ path: join(__dirname, '../.env.test') });
  process.env.NODE_ENV = 'test';
};

import * as casual from 'casual';
import { UserRole } from '@/database/entities';

export interface CreateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role?: UserRole;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export const userFactory = {
  createData: (overrides: Partial<CreateUserData> = {}): CreateUserData => ({
    email: casual.email.toLowerCase(),
    firstName: casual.first_name,
    lastName: casual.last_name,
    role: UserRole.USER,
    ...overrides,
  }),
  updateData: (overrides: Partial<UpdateUserData> = {}): UpdateUserData => ({
    firstName: casual.first_name,
    lastName: casual.last_name,
    ...overrides,
  }),
  invalidEmails: [
    'notanemail',
    '@example.com',
    'user@',
    'user@.com',
    'user@domain',
    'user name@example.com',
    'user@exam ple.com',
  ],
  xssPayloads: [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    'javascript:alert("XSS")',
    '<body onload=alert("XSS")>',
    '<<SCRIPT>alert("XSS");//<</SCRIPT>',
  ],
  sqlInjectionPayloads: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    '" OR "1"="1',
    "admin' --",
    "admin' #",
    "' OR 1=1 --",
  ],
};

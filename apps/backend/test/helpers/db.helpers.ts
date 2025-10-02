import { EntityManager } from '@mikro-orm/core';
import { User, UserRole } from '../../src/database/entities';
import { DatabaseSeeder } from '../../src/database/seeders/DatabaseSeeder';
import { getOrm, getJwtService, getConfigService } from './bootstrap';
import { createAccessToken } from './auth.spec.helpers';
import * as bcrypt from 'bcrypt';
import usersData from '@app/seed/user.json';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  token?: string;
}

export async function cleanDatabase(): Promise<void> {
  const orm = getOrm();
  if (orm) await orm.schema.clearDatabase();
}

export async function seedTestUsers(): Promise<{
  admin: TestUser;
  user: TestUser;
}> {
  const orm = getOrm();
  const em = orm.em.fork();

  // Use the actual seed data from @app/seed
  const seeder = new DatabaseSeeder();
  await seeder.run(em);

  // Get the seeded admin user
  const admin = await em.findOne(User, { email: usersData[0].email });

  // Create an additional regular user for testing
  const regularUserPw = 'User123!';
  const hashedPassword = await bcrypt.hash(regularUserPw, 10);
  const user = em.create(User, {
    email: 'user@test.com',
    password: hashedPassword,
    role: UserRole.USER,
    firstName: 'User',
    lastName: 'Test',
  } as any);
  await em.persistAndFlush(user);

  const jwtService = getJwtService();
  const configService = getConfigService();
  const adminToken = await createAccessToken(admin!, jwtService, configService);
  const userToken = await createAccessToken(user, jwtService, configService);

  return {
    admin: {
      id: admin!.id,
      email: admin!.email,
      password: usersData[0].password, // Original password from seed
      role: admin!.role,
      token: adminToken,
    },
    user: {
      id: user.id,
      email: user.email,
      password: regularUserPw,
      role: user.role,
      token: userToken,
    },
  };
}

export async function createTestUser(data: Partial<User>): Promise<User> {
  const orm = getOrm();
  const em = orm.em.fork();
  const hashedPassword = data.password
    ? await bcrypt.hash(data.password, 10)
    : await bcrypt.hash('Test123!', 10);
  const user = em.create(User, {
    email: data.email || `test${Date.now()}@test.com`,
    password: hashedPassword,
    role: data.role || UserRole.USER,
    firstName: data.firstName || 'Test',
    lastName: data.lastName || 'User',
    imgUrl: data.imgUrl,
    lastLoginAt: data.lastLoginAt,
    deletedAt: data.deletedAt,
  } as any);
  await em.persistAndFlush(user);
  return user;
}

export function getEntityManager(): EntityManager {
  const orm = getOrm();
  return orm.em.fork();
}

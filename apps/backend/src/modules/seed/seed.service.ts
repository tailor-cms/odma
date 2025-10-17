import { User, UserRole } from '@/database/entities';
import { EntityManager } from '@mikro-orm/core';
import { DatabaseSeeder } from '@/database/seeders/DatabaseSeeder';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { UserService } from '@/modules/user/user.service';
import { faker } from '@faker-js/faker';

@Injectable()
export class SeedService {
  constructor(
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
  ) {
    this.logger.setContext(SeedService.name);
  }

  async resetDatabase(): Promise<void> {
    this.logger.debug('Resetting database for tests');
    const em = this.em.fork();
    await em.nativeDelete(User, {});
    const seeder = new DatabaseSeeder();
    await seeder.run(em);
    this.logger.debug('Database reset completed');
  }

  async createTestUser(): Promise<User> {
    this.logger.debug('Creating test user');
    const userData = {
      email: faker.internet.email().toLowerCase(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: UserRole.USER,
    };
    const user = await this.userService.create(userData);
    this.logger.debug(`Test user created: ${user.email}`);
    return user;
  }
}

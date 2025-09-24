import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { User, UserRole } from '../entities/user.entity';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      await em.nativeDelete(User, {});
    }
    const users = [
      {
        email: 'admin@example.com',
        password: 'test123!',
        role: UserRole.ADMIN,
        firstName: 'Admin',
        lastName: 'User',
      },
      {
        email: 'john.doe@example.com',
        password: 'admin123!',
        role: UserRole.USER,
        firstName: 'John',
        lastName: 'Doe',
      },
      {
        email: 'jane.smith@example.com',
        password: 'test123!',
        role: UserRole.USER,
        firstName: 'Jane',
        lastName: 'Smith',
      },
    ];
    for (const userData of users) {
      em.create(User, userData as any);
    }
    await em.flush();
    console.log('✅ Database seeded successfully');
    console.log('📧 Admin email: admin@example.com');
    console.log('🔑 Admin password: test123!');
  }
}

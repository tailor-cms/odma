import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { User } from '../entities/user.entity';
import users from '@app/seed/user.json';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      await em.nativeDelete(User, {});
    }
    for (const it of users) {
      em.create(User, it as any);
    }
    await em.flush();
    if (process.env.NODE_ENV !== 'test') {
      console.log('✅ Database seeded successfully');
      console.log(`📧 Email: ${users[0].email}`);
      console.log(`🔑 Password: ${users[0].password}`);
    }
  }
}

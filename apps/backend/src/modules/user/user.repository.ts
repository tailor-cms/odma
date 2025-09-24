import { EntityRepository } from '@mikro-orm/core';
import { User } from '@/database/entities';

export class UserRepository extends EntityRepository<User> {
  async get(id: string): Promise<User | null> {
    return this.findOne(id, { filters: false });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email: email.toLowerCase() }, { filters: false });
  }
}

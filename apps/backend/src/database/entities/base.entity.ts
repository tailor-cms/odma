import { Property, PrimaryKey } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';

export abstract class BaseEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ nullable: true })
  deletedAt?: Date | null = null;

  softDelete(): void {
    this.deletedAt = new Date();
  }

  restore(): void {
    this.deletedAt = undefined;
  }

  get isDeleted(): boolean {
    return !!this.deletedAt;
  }
}

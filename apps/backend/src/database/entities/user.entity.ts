import * as bcrypt from 'bcrypt';
import type {
  EventArgs } from '@mikro-orm/core';
import {
  BeforeCreate,
  BeforeUpdate,
  Entity,
  Enum,
  Index,
  Property,
} from '@mikro-orm/core';
import { Exclude } from 'class-transformer';
import { BaseEntity } from './base.entity';
import { UserRepository } from '@/modules/user/user.repository';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Entity({ tableName: 'users', repository: () => UserRepository })
export class User extends BaseEntity {
  @Property({ unique: true, nullable: false })
  @Index()
  email!: string;

  @Property({ hidden: true, nullable: false })
  @Exclude()
  password!: string;

  @Enum(() => UserRole)
  role: UserRole = UserRole.USER;

  @Property({ nullable: true, length: 200 })
  firstName?: string;

  @Property({ nullable: true, length: 200 })
  lastName?: string;

  @Property({ nullable: true, type: 'text' })
  imgUrl?: string;

  @Property({ nullable: true })
  lastLoginAt?: Date;

  @Property({ persist: false })
  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  @Property({ persist: false })
  get fullName(): string | null {
    const { firstName, lastName } = this;
    return firstName && lastName
      ? `${firstName} ${lastName}`
      : firstName || lastName || null;
  }

  @Property({ persist: false })
  get label(): string {
    return this.fullName || this.email;
  }

  @Property({ persist: false })
  get profile() {
    return {
      id: this.id,
      email: this.email,
      role: this.role,
      label: this.label,
      imgUrl: this.imgUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  @BeforeCreate()
  @BeforeUpdate()
  private async hashPassword(args: EventArgs<User>) {
    // Only hash if password is being set/changed and isn't already hashed
    if (this.password && !this.password.startsWith('$2')) {
      // Get saltRounds from MikroORM config (injected from ConfigService)
      // Falls back to env for CLI operations like seeding
      const config = args.em.config.getAll() as any;
      const saltRounds =
        config.saltRounds || parseInt(process.env.AUTH_SALT_ROUNDS || '10', 10);
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  @BeforeCreate()
  @BeforeUpdate()
  normalizeEmail() {
    if (!this.email) return;
    this.email = this.email.toLowerCase().trim();
  }

  async validatePassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  }

  toJSON() {
    const { password, refreshToken, ...user } = this as any;
    return {
      ...user,
      profile: this.profile,
      fullName: this.fullName,
      label: this.label,
      isAdmin: this.isAdmin,
      isDeleted: this.isDeleted,
    };
  }
}

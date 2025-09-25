import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  FilterQuery,
  SqlEntityManager } from '@mikro-orm/postgresql';
import {
  QueryOrder,
} from '@mikro-orm/postgresql';
import { User, UserRole } from '@/database/entities';
import type { AuthService } from '@/modules/auth/auth.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { UserRepository } from './user.repository';

import type {
  CreateUserDto,
  UpdateUserDto,
  QueryUserDto,
  PaginatedUsersDto } from './dto';
import {
  UserSortField,
  SortOrder,
} from './dto';
import { randomBytes } from 'node:crypto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: UserRepository,
    private em: SqlEntityManager,
    private authService: AuthService,
  ) {}

  async get(id: string): Promise<User> {
    const user = await this.userRepository.get(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async create(payload: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(payload.email);
    if (existingUser)
      throw new ConflictException(
        existingUser.isDeleted
          ? 'Email was previously used and is currently inactivated.'
          : 'User with this email already exists',
      );
    const user = this.userRepository.create({
      ...payload,
      email: payload.email.toLowerCase(),
      password: randomBytes(20).toString('hex'),
      role: payload.role || UserRole.USER,
    } as any);
    await this.em.persistAndFlush(user);
    try {
      await this.authService.sendInvitationEmail(user);
    } catch (error) {
      console.error('Failed to send invitation email:', error);
    }
    return user;
  }

  async findAll(query: QueryUserDto): Promise<PaginatedUsersDto> {
    const {
      search,
      includeArchived,
      page = 1,
      limit = 20,
      sortBy = UserSortField.CREATED_AT,
      sortOrder = SortOrder.DESC,
    } = query;
    const where: FilterQuery<User> = {};
    if (search) {
      where.$or = [
        { email: { $ilike: `%${search}%` } },
        { firstName: { $ilike: `%${search}%` } },
        { lastName: { $ilike: `%${search}%` } },
      ];
    }
    if (query.email) where.email = query.email;
    if (!includeArchived) where.deletedAt = null;
    const sortFieldMap: Record<UserSortField, keyof User> = {
      [UserSortField.ID]: 'id',
      [UserSortField.EMAIL]: 'email',
      [UserSortField.FIRST_NAME]: 'firstName',
      [UserSortField.LAST_NAME]: 'lastName',
      [UserSortField.CREATED_AT]: 'createdAt',
      [UserSortField.UPDATED_AT]: 'updatedAt',
    };
    const orderBy = {
      [sortFieldMap[sortBy]]:
        sortOrder === SortOrder.ASC ? QueryOrder.ASC : QueryOrder.DESC,
    };
    const [users, total] = await this.userRepository.findAndCount(where, {
      limit,
      offset: (page - 1) * limit,
      orderBy,
      filters: includeArchived ? false : undefined,
    });
    const totalPages = Math.ceil(total / limit);
    return {
      data: users.map((user) => user.toJSON()),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  async update(id: string, payload: UpdateUserDto): Promise<User> {
    const user = await this.get(id);
    if (payload.email && payload.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(payload.email);
      if (existingUser) throw new ConflictException('Email is already in use');
    }
    Object.assign(user, payload);
    await this.em.flush();
    return user;
  }

  async remove(id: string): Promise<void> {
    const user = await this.get(id);
    user.deletedAt = new Date();
    await this.em.flush();
  }

  async restore(id: string): Promise<User> {
    const user = await this.get(id);
    if (!user.isDeleted) throw new BadRequestException('User is not archived');
    user.deletedAt = undefined;
    await this.em.flush();
    return user;
  }

  async reinvite(id: string): Promise<void> {
    const user = await this.get(id);
    try {
      await this.authService.sendInvitationEmail(user);
    } catch (error) {
      console.error('Failed to send reinvitation email:', error);
      throw new BadRequestException('Failed to send invitation email');
    }
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateUserDto,
  UpdateUserDto,
  QueryUserDto,
  PaginatedUsersDto,
} from './dto';
import { EntityManager, QueryOrder } from '@mikro-orm/core';
import { User, UserRole } from '@/database/entities';
import { UserSortField, SortOrder } from './dto';

import { AuthService } from '@/modules/auth/auth.service';
import type { FilterQuery } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { PinoLogger } from 'nestjs-pino';
import { UserRepository } from './user.repository';
import { randomBytes } from 'node:crypto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: UserRepository,
    private readonly em: EntityManager,
    private readonly logger: PinoLogger,
    private readonly authService: AuthService,
  ) {
    this.logger.setContext(UserService.name);
  }

  async get(id: string): Promise<User> {
    this.logger.debug(`Fetching user with id: ${id}`);
    const user = await this.userRepository.get(id);
    if (!user) {
      this.logger.debug(`User with id ${id} not found`);
      throw new NotFoundException(`User with id ${id} not found`);
    }
    this.logger.debug(`User found: ${user.email}`);
    return user;
  }

  async create(payload: CreateUserDto): Promise<User> {
    this.logger.debug(`Creating user with email: ${payload.email}`);
    const existingUser = await this.userRepository.findByEmail(payload.email);
    if (existingUser) {
      const msgSuffix = existingUser.isDeleted
        ? ' was previously used and is currently inactivated.'
        : ' already exists';
      this.logger.debug(`User creation error: ${payload.email} ${msgSuffix}`);
      throw new ConflictException(
        existingUser.isDeleted
          ? `Email ${msgSuffix}. Please restore the user instead.`
          : `User with this email ${msgSuffix}`,
      );
    }
    const user = this.userRepository.create({
      ...payload,
      email: payload.email.toLowerCase(),
      password: randomBytes(20).toString('hex'),
      role: payload.role || UserRole.USER,
    } as any);
    await this.em.persistAndFlush(user);
    this.logger.debug(`User created with email: ${payload.email}`);
    await this.authService.sendInvitationEmail(user);
    return user;
  }

  async findAll(query: QueryUserDto): Promise<PaginatedUsersDto> {
    this.logger.debug('Fetching users with query:', query);
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
      // Check if we're using PostgreSQL (supports $ilike) or SQLite ($like)
      const driverName = this.em.getDriver().constructor.name;
      const isPostgres = driverName === 'PostgreSqlDriver';
      const likeOperator = isPostgres ? '$ilike' : '$like';
      where.$or = [
        { email: { [likeOperator]: `%${search}%` } },
        { firstName: { [likeOperator]: `%${search}%` } },
        { lastName: { [likeOperator]: `%${search}%` } },
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
    this.logger.debug('Constructed where clause:', where);
    const [users, total] = await this.userRepository.findAndCount(where, {
      filters: includeArchived ? false : undefined,
      offset: (page - 1) * limit,
      limit,
      orderBy,
    });
    const totalPages = Math.ceil(total / limit);
    this.logger.debug(`Fetched ${users.length} users`);
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

  async update(
    id: string,
    payload: UpdateUserDto,
    currentUser?: any,
  ): Promise<User> {
    this.logger.debug(`Updating user with id: ${id}`);
    const user = await this.get(id);
    this.logger.debug(`User found for update: ${user.email}`);
    // Check if trying to demote the last admin, self-demotion handled below
    if (payload.role === UserRole.USER && user.role === UserRole.ADMIN) {
      const adminCount = await this.userRepository.count({
        role: UserRole.ADMIN,
        deletedAt: null,
      });
      if (adminCount <= 1) {
        this.logger.debug('Attempted to demote the last admin');
        throw new BadRequestException('Cannot demote the last admin');
      }
    }
    // Check if admin is trying to demote themselves
    if (
      currentUser &&
      currentUser.id === id &&
      payload.role === UserRole.USER
    ) {
      this.logger.debug('Admin attempted to demote themselves');
      throw new BadRequestException('Cannot demote your own admin account');
    }
    if (payload.email && payload.email !== user.email) {
      this.logger.debug('Attempting to change email to:', payload.email);
      this.logger.debug('Checking for existing user with new email');
      const existingUser = await this.userRepository.findByEmail(payload.email);
      if (existingUser) throw new ConflictException('Email is already in use');
    }
    Object.assign(user, payload);
    await this.em.flush();
    this.logger.debug(`User ${id} updated`);
    await this.em.refresh(user);
    return user;
  }

  async remove(id: string, currentUser?: any): Promise<void> {
    this.logger.debug(`Archiving user with id: ${id}`);
    const user = await this.get(id);

    // Check if trying to delete the last admin
    if (user.role === UserRole.ADMIN) {
      const adminCount = await this.userRepository.count({
        role: UserRole.ADMIN,
        deletedAt: null,
      });
      if (adminCount <= 1) {
        this.logger.debug('Attempted to delete the last admin');
        throw new BadRequestException('Cannot delete the last admin');
      }
    }

    // Check if admin is trying to delete themselves
    if (currentUser && currentUser.id === id) {
      this.logger.debug('Admin attempted to delete themselves');
      throw new BadRequestException('Cannot delete your own admin account');
    }

    user.deletedAt = new Date();
    this.logger.debug(`User: ${user.email} has been archived`);
    await this.em.flush();
  }

  async restore(id: string): Promise<User> {
    this.logger.debug(`Restoring user with id: ${id}`);
    const user = await this.get(id);
    this.logger.debug(`User found for restoration: ${user.email}`);
    if (!user.isDeleted) throw new BadRequestException('User is not archived');
    user.deletedAt = undefined;
    await this.em.flush();
    this.logger.debug(`User: ${user.email} has been restored`);
    return user;
  }

  async reinvite(id: string): Promise<void> {
    this.logger.debug(`Reinviting user with id: ${id}`);
    const user = await this.get(id);
    this.logger.debug('User found for reinvitation:', user.email);
    try {
      await this.authService.sendInvitationEmail(user);
    } catch {
      throw new BadRequestException('Failed to send invitation email');
    }
  }
}

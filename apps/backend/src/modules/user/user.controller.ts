import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto';
import { UserDto, PaginatedUsersDto } from './dto';
import type { User } from '@/database/entities';
import { UserRole } from '@/database/entities';
import { UserService } from './user.service';
import { Roles } from '@/modules/auth/decorators';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List users (Admin only)' })
  @ApiResponse({
    description: 'List of users',
    status: 200,
    type: PaginatedUsersDto,
  })
  async fetch(@Query() queryDto: QueryUserDto) {
    return this.userService.findAll(queryDto);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create or invite user (Admin only)' })
  @ApiResponse({
    description: 'User created successfully',
    status: 201,
    type: UserDto,
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    return user.profile;
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found', type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async get(@Param('id') id: string): Promise<User> {
    return this.userService.get(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    description: 'User updated successfully',
    status: 200,
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }

  @Post(':id/restore')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Restore soft-deleted user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User restored successfully',
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async restore(@Param('id') id: string): Promise<User> {
    return this.userService.restore(id);
  }

  @Post(':id/reinvite')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Reinvite user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 202, description: 'Invitation sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async reinvite(@Param('id') id: string): Promise<void> {
    await this.userService.reinvite(id);
  }
}

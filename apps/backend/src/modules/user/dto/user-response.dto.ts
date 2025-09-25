import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@/database/entities';

@Exclude()
export class UserDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  email: string;

  @Expose()
  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @Expose()
  @ApiProperty()
  firstName?: string;

  @Expose()
  @ApiProperty()
  lastName?: string;

  @Expose()
  @ApiProperty()
  fullName?: string;

  @Expose()
  @ApiProperty()
  label?: string;

  @Expose()
  @ApiProperty()
  imgUrl?: string;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  @Expose()
  @ApiProperty()
  deletedAt?: Date;
}

export class PaginatedUsersDto {
  @ApiProperty({ type: [UserDto] })
  @Type(() => UserDto)
  data: UserDto[];

  @ApiProperty({ description: 'Total number of items', example: 100 })
  total: number;

  @ApiProperty({ description: 'Number of items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  totalPages: number;

  @ApiProperty({ description: 'Has previous page', example: false })
  hasPrevious: boolean;

  @ApiProperty({ description: 'Has next page', example: true })
  hasNext: boolean;
}

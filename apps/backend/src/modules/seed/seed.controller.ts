import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EnvironmentGuard } from './guards';
import { Public } from '@/modules/auth/decorators';
import { SeedResponseDto } from './dto';
import { SeedService } from './seed.service';

@ApiTags('seed')
@Controller('seed')
@UseGuards(EnvironmentGuard)
@Public()
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @ApiOperation({
    summary: 'Reset database with base seed data',
    description:
      'Clears all data and reseeds with base admin user. Only in non prod env.',
  })
  @ApiResponse({
    status: 200,
    description: 'Database reset successfully',
    type: SeedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not available in production',
  })
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetDatabase(): Promise<SeedResponseDto> {
    await this.seedService.resetDatabase();
    return {
      message: 'Database reset successfully',
    };
  }

  @ApiOperation({
    summary: 'Create a single test user',
    description: 'Creates a test user with random data',
  })
  @ApiResponse({
    status: 201,
    description: 'Test user created successfully',
    type: SeedResponseDto,
  })
  @Post('user')
  async seedUser(): Promise<SeedResponseDto> {
    const data = await this.seedService.createTestUser();
    return data.toJSON();
  }
}

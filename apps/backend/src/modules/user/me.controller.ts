import { Controller, Body, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateProfileDto } from './dto';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { UserService } from './user.service';
import { User } from '@/database/entities';

@ApiTags('me')
@Controller('me')
export class CurrentUserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @Get()
  async get(@CurrentUser() user: any): Promise<{ user: User }> {
    return { user };
  }

  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @Patch()
  async update(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<{ user: any }> {
    const updatedUser = await this.userService.update(
      user.id,
      updateProfileDto,
    );
    return { user: updatedUser.toJSON() };
  }
}

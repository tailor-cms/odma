import { Controller, Body, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateProfileDto, UserDto } from './dto';
import { UserService } from './user.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('me')
@Controller('me')
export class CurrentUserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @Get()
  async get(@CurrentUser() user: any): Promise<{ user: UserDto }> {
    return { user };
  }

  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @Patch()
  async update(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<{ user: UserDto }> {
    const updatedUser = await this.userService.update(
      user.id,
      updateProfileDto,
    );
    return { user: updatedUser.toJSON() };
  }
}

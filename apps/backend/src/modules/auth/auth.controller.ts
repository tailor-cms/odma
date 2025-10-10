import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  LoginResponseDto,
  ChangePasswordResponseDto,
} from './dto';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Public } from './decorators';
import type { Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: LoginResponseDto
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, accessToken, expiresInMs } =
      await this.authService.login(loginDto);
    const cookieConfig = this.configService.get('auth.cookie');
    response.cookie(cookieConfig.name, accessToken, {
      httpOnly: cookieConfig.httpOnly,
      signed: cookieConfig.signed,
      maxAge: expiresInMs,
      secure: this.configService.get<boolean>('isProduction'),
    });
    return { user, accessToken, expiresIn: expiresInMs };
  }

  @Get('logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(user);
    const cookieConfig = this.configService.get('auth.cookie');
    response.clearCookie(cookieConfig.name);
  }

  @ApiOperation({ summary: 'Change current password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: ChangePasswordResponseDto
  })
  @ApiResponse({ status: 401, description: 'Current password is incorrect!' })
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user, changePasswordDto);
  }

  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent if user exists',
  })
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<void> {
    await this.authService.sendResetPasswordToken(forgotPasswordDto);
  }

  @ApiOperation({ summary: 'Reset password with token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 204, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<void> {
    await this.authService.resetPassword(resetPasswordDto);
  }

  @ApiOperation({ summary: 'Validate reset token' })
  @ApiResponse({ status: 202, description: 'Token is valid' })
  @Public()
  @Post('reset-password/token-status')
  @HttpCode(HttpStatus.ACCEPTED)
  async validateResetToken(@Body('token') token: string): Promise<void> {
    await this.authService.validateResetPasswordToken(token);
  }
}

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
} from './dto';
import type { AuthConfig } from '@/config';
import { EntityManager } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from './strategies/jwt.strategy';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@mikro-orm/nestjs';
import { MailService } from '@/modules/mail/mail.service';
import { PinoLogger } from 'nestjs-pino';
import { User } from '@/database/entities';
import { UserRepository } from '@/modules/user/user.repository';

import * as bcrypt from 'bcrypt';
import ms from 'ms';

export enum Audience {
  ACCESS = 'scope:access',
  INVITATION = 'scope:invitation',
  RESET = 'scope:reset',
}

@Injectable()
export class AuthService {
  private config: AuthConfig;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: UserRepository,
    private readonly em: EntityManager,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly logger: PinoLogger,
  ) {
    this.config = configService.get('auth') as AuthConfig;
    this.logger.setContext(AuthService.name);
  }

  async login({ email, password }: LoginDto) {
    this.logger.debug(`Login attempt for email: ${email}`);
    const user = await this.validateCredentials(email, password);
    if (!user) {
      this.logger.info(`Login attempt failed: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    const { accessToken, expiresInMs } = await this.createAccessToken(user);
    this.logger.debug(`Login success for email: ${email}`);
    return { user: user.toJSON(), accessToken, expiresInMs };
  }

  async logout(user: User): Promise<void> {
    this.logger.debug(`Logout attempt for email: ${user.email}`);
    // TODO: Figure out better name for this field
    user.lastLoginAt = new Date();
    await this.em.flush();
    this.logger.debug(`Logout success for email: ${user.email}`);
  }

  async validateCredentials(
    email: string,
    pw: string,
  ): Promise<User | undefined> {
    this.logger.debug(`Validating credentials for email: ${email}`);
    const user = await this.userRepository.findByEmail(email);
    if (!user || user.isDeleted) {
      this.logger.info(`No user found or user is deleted for email: ${email}`);
      return;
    }
    const isValidPassword = await user.validatePassword(pw);
    if (!isValidPassword) {
      this.logger.debug(`Invalid password for email: ${email}`);
      return;
    }
    this.logger.debug(`Credentials validated for email: ${email}`);
    return user;
  }

  async changePassword(
    user: User,
    { currentPassword, newPassword }: ChangePasswordDto,
  ): Promise<{ message: string }> {
    this.logger.debug(`Change password attempt for email: ${user.email}`);
    const isValid = await user.validatePassword(currentPassword);
    if (!isValid) {
      this.logger.debug(`Invalid current password for email: ${user.email}`);
      throw new UnauthorizedException('Password is incorrect');
    }
    user.password = await this.hashPassword(newPassword);
    await this.em.flush();
    this.logger.debug(`Password changed for email: ${user.email}`);
    return { message: 'Password has been changed successfully' };
  }

  async resetPassword({ token, newPassword }: ResetPasswordDto): Promise<void> {
    this.logger.debug('Reset password attempt');
    const user = await this.validateResetPasswordToken(token);
    this.logger.debug(`Reset password request for user: ${user.email}`);
    user.password = await this.hashPassword(newPassword);
    await this.em.flush();
    this.logger.debug(`Password has been reset for user: ${user.email}`);
  }

  async validateResetPasswordToken(token: string): Promise<User> {
    this.logger.debug('Validating reset password token');
    try {
      const payload: JwtPayload = this.jwtService.decode(token);
      if (!payload?.sub || payload.aud !== Audience.RESET) {
        this.logger.debug(`Invalid reset token payload`);
        throw new BadRequestException('Invalid reset token');
      }
      const user = await this.userRepository.get(payload.sub);
      if (!user || user.isDeleted) {
        this.logger.debug('No user found for reset token');
        throw new BadRequestException('Invalid reset token');
      }
      const secret = this.getTokenSecret(user);
      await this.jwtService.verify(token, { secret });
      this.logger.debug(`Reset token validated for user: ${user.email}`);
      return user;
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  async sendResetPasswordToken({ email }: ForgotPasswordDto): Promise<void> {
    this.logger.debug(`Password reset email request for: ${email}`);
    const user = await this.userRepository.findByEmail(email);
    if (!user || user.isDeleted) {
      this.logger.info(`No user found or user is deleted for email: ${email}`);
      return;
    }
    const token = await this.createToken(user, Audience.RESET, {
      secret: this.getTokenSecret(user),
      expiresInMs: ms('1h'),
    });
    try {
      await this.mailService.sendPasswordResetEmail(user, token);
      this.logger.debug(`Sent reset email to: ${email}`);
    } catch (err) {
      this.logger.info('Failed to send password reset email:', err);
    }
  }

  async sendInvitationEmail(user: User): Promise<void> {
    this.logger.debug(`Sending invitation email to: ${user.email}`);
    const token = await this.createInvitationToken(user);
    return this.mailService.sendInvitationEmail(user, token);
  }

  private async createAccessToken(user: User) {
    this.logger.debug(`Creating access token for user: ${user.email}`);
    user.lastLoginAt = new Date();
    const { expiresInMs } = this.config.jwt;
    const accessToken = await this.createToken(user, Audience.ACCESS, {
      expiresInMs,
    });
    await this.em.flush();
    this.logger.debug(`Access token created for user: ${user.email}`);
    return {
      user,
      accessToken,
      expiresInMs,
    };
  }

  private async createInvitationToken(user: User): Promise<string> {
    this.logger.debug(`Creating invitation token for user: ${user.email}`);
    const secret = this.getTokenSecret(user);
    const token = await this.createToken(user, Audience.INVITATION, {
      secret,
      expiresInMs: ms('7d'),
    });
    this.logger.debug(`Invitation token created for user: ${user.email}`);
    return token;
  }

  private async createToken(
    user: User,
    audience: string,
    { secret, expiresInMs }: { secret?: string; expiresInMs?: number } = {},
  ): Promise<string> {
    const config = this.config.jwt;
    expiresInMs = expiresInMs || config.expiresInMs;
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Date.now(),
    };
    return this.jwtService.signAsync(payload, {
      secret: secret || config.secret,
      expiresIn: ms(expiresInMs),
      audience,
      issuer: config.issuer,
    });
  }

  // Use a combination of JWT secret, user pw hash, and creation time
  // This ensures the token becomes invalid if the password is changed
  private getTokenSecret(user: User): string {
    const baseSecret = this.config.jwt.secret;
    return `${baseSecret}-${user.password}-${user.createdAt.getTime()}`;
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.config.saltRounds);
  }
}

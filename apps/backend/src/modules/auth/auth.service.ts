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
import * as bcrypt from 'bcrypt';
import type { AuthConfig } from '@/config';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { MailService } from '@/modules/mail/mail.service';
import type { SqlEntityManager } from '@mikro-orm/postgresql';
import { User } from '@/database/entities';
import type { UserRepository } from '@/modules/user/user.repository';
import type { JwtPayload } from './strategies/jwt.strategy';
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
    private em: SqlEntityManager,
    private configService: ConfigService,
    private mailService: MailService,
    private jwtService: JwtService,
  ) {
    this.config = configService.get('auth') as AuthConfig;
  }

  async login({ email, password }: LoginDto) {
    const user = await this.validateCredentials(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const { accessToken, expiresInMs } = await this.createAccessToken(user);
    return { user: user.toJSON(), accessToken, expiresInMs };
  }

  async logout(user: User): Promise<void> {
    // TODO: Figure out better name for this field
    user.lastLoginAt = new Date();
    await this.em.flush();
  }

  async validateCredentials(email: string, pw: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || user.isDeleted) return null;
    return (await user.validatePassword(pw)) ? user : null;
  }

  async changePassword(
    user: User,
    { currentPassword, newPassword }: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const isValid = await user.validatePassword(currentPassword);
    if (!isValid) throw new UnauthorizedException('Password is incorrect');
    user.password = await this.hashPassword(newPassword);
    await this.em.flush();
    return { message: 'Password has been changed successfully' };
  }

  async resetPassword({ token, newPassword }: ResetPasswordDto): Promise<void> {
    const user = await this.validateResetPasswordToken(token);
    user.password = await this.hashPassword(newPassword);
    await this.em.flush();
  }

  async validateResetPasswordToken(token: string): Promise<User> {
    try {
      const payload: JwtPayload = this.jwtService.decode(token);
      if (!payload?.sub || payload.aud !== Audience.RESET)
        throw new BadRequestException('Invalid reset token');

      const user = await this.userRepository.get(payload.sub);
      if (!user || user.isDeleted)
        throw new BadRequestException('Invalid reset token');

      const secret = this.getTokenSecret(user);
      await this.jwtService.verify(token, { secret });
      return user;
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  async sendResetPasswordToken({ email }: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || user.isDeleted) return;
    const token = await this.createToken(user, Audience.RESET, {
      secret: this.getTokenSecret(user),
      expiresInMs: ms('1h'),
    });
    try {
      await this.mailService.sendPasswordResetEmail(user, token);
    } catch (err) {
      console.error('Failed to send password reset email:', err);
    }
  }

  async sendInvitationEmail(user: User): Promise<void> {
    const token = await this.createInvitationToken(user);
    return this.mailService.sendInvitationEmail(user, token);
  }

  private async createAccessToken(user: User) {
    user.lastLoginAt = new Date();
    const { expiresInMs } = this.config.jwt;
    const accessToken = await this.createToken(user, Audience.ACCESS, {
      expiresInMs,
    });
    await this.em.flush();
    return {
      user,
      accessToken,
      expiresInMs,
    };
  }

  private async createInvitationToken(user: User): Promise<string> {
    const secret = this.getTokenSecret(user);
    return this.createToken(user, Audience.INVITATION, {
      secret,
      expiresInMs: ms('7d'),
    });
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

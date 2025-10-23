import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { User } from '@/database/entities';

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: EntityRepository<User>,
  ) {
    const jwtSecret = configService.get<string>('auth.jwt.secret');
    if (!jwtSecret) {
      throw new Error('JWT secret is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const { cookies, signedCookies } = req || {};
          return cookies?.access_token || signedCookies?.access_token || null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate({ sub, email }: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne(
      { id: sub, email },
      { populate: false, refresh: true },
    );
    if (!user) throw new UnauthorizedException('User not found');
    if (user.isDeleted)
      throw new UnauthorizedException('User account has been deactivated');
    return user;
  }
}

import * as jwt from 'jsonwebtoken';
import { Audience } from '../../src/modules/auth/auth.service';
import type { AuthConfig } from '../../src/config';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '../../src/modules/auth/strategies/jwt.strategy';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../src/database/entities';
import ms from 'ms';

// Password generation util
export function generateValidPassword(): string {
  return 'Test@123456';
}

// Mock mail service for tests
export const mockMailService = {
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendInvitationEmail: jest.fn().mockResolvedValue(undefined),
};

// Token configuration for different audiences
const TOKEN_CONFIG = {
  [Audience.RESET]: { expiresIn: '1h' },
  [Audience.INVITATION]: { expiresIn: '7d' },
  [Audience.ACCESS]: { expiresIn: '15m' },
} as const;

/**
 * Generate the user-specific secret for token signing
 * Matches the backend's getTokenSecret implementation
 */
function generateUserSecret(user: User, config: AuthConfig): string {
  return `${config.jwt.secret}-${user.password}-${user.createdAt.getTime()}`;
}

/**
 * Create a test token with configurable parameters
 */
async function createToken(
  user: User,
  audience: Audience,
  jwtService: JwtService,
  configService: ConfigService,
  options?: {
    expired?: boolean;
    expiresIn?: string;
  },
): Promise<string> {
  const config = configService.get<AuthConfig>('auth');
  if (!config) throw new Error('Auth config not found');

  // ACCESS tokens use default secret, others use user-specific secret
  const secret = audience === Audience.ACCESS
    ? config.jwt.secret
    : generateUserSecret(user, config);
  const tokenConfig = TOKEN_CONFIG[audience];
  const expiresIn = options?.expiresIn || tokenConfig.expiresIn;

  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: Date.now(),
  };

  // For expired tokens, use native jwt.sign to have precise control over exp
  if (options?.expired) {
    return jwt.sign(
      {
        ...payload,
        iat: Date.now() - ms('2h'), // Created 2 hours ago
        exp: Math.floor((Date.now() - ms('1h')) / 1000), // Expired 1 hour ago
      },
      secret,
      {
        audience,
        issuer: config.jwt.issuer,
      },
    );
  }

  // Normal token creation using NestJS JwtService
  return jwtService.signAsync(payload, {
    secret,
    expiresIn: ms(ms(expiresIn)),
    audience,
    issuer: config.jwt.issuer,
  });
}

// Convenience functions for specific token types
export const createAccessToken = (
  user: User,
  jwtService: JwtService,
  configService: ConfigService,
): Promise<string> =>
  createToken(user, Audience.ACCESS, jwtService, configService);

export const createResetToken = (
  user: User,
  jwtService: JwtService,
  configService: ConfigService,
): Promise<string> =>
  createToken(user, Audience.RESET, jwtService, configService);

export const createInvitationToken = (
  user: User,
  jwtService: JwtService,
  configService: ConfigService,
): Promise<string> =>
  createToken(user, Audience.INVITATION, jwtService, configService);

export const createExpiredToken = (
  user: User,
  jwtService: JwtService,
  configService: ConfigService,
): Promise<string> =>
  createToken(user, Audience.RESET, jwtService, configService, {
    expired: true,
  });

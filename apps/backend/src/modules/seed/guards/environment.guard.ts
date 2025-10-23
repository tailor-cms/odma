import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvironmentGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(_ctx: ExecutionContext): boolean {
    const isProduction = this.configService.get<boolean>('isProduction', false);
    if (!isProduction) return true;
    throw new ForbiddenException('Seed endpoints are not available in prod');
  }
}

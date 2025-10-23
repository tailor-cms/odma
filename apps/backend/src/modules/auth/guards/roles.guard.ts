import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOWED_ROLES_KEY } from '../decorators/roles.decorator';
import type { UserRole } from '@/database/entities';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ALLOWED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!allowedRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;
    return allowedRoles.some((role) => user.role === role);
  }
}

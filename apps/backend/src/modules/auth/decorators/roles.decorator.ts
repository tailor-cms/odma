import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@/database/entities';

export const ALLOWED_ROLES_KEY = 'allowedUserRoles';
export const Roles = (...roles: UserRole[]) =>
  SetMetadata(ALLOWED_ROLES_KEY, roles);

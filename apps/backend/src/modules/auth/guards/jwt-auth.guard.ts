import type {
  ExecutionContext } from '@nestjs/common';
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Reflector } from '@nestjs/core';
import { IS_PUBLIC_FLAG_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_FLAG_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, _info: any) {
    if (err || !user)
      throw err || new UnauthorizedException('Authentication required');
    return user;
  }
}

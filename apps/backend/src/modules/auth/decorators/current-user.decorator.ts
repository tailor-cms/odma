import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom parameter decorator to extract the current user from the request.
 *
 * @param dataKey - Optional key to extract a specific property from the user object
 * @returns The user object or a specific property if dataKey is provided
 *
 * @example
 * async getProfile(@CurrentUser() user: any) { }
 * Get a specific property
 * async getEmail(@CurrentUser('email') email: string) { }
 * Note: Do not use User entity as the type annotation, as it will
 * cause serialization issues.
 */
export const CurrentUser = createParamDecorator(
  (dataKey: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return null;
    if (dataKey) return user[dataKey];
    return user;
  },
);

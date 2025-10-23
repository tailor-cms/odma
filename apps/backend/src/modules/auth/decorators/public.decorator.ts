import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_FLAG_KEY = 'isPublicRoute';
export const Public = () => SetMetadata(IS_PUBLIC_FLAG_KEY, true);

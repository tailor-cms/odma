import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Used only in AuthController for login route
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}

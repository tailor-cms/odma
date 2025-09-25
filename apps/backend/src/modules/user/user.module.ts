import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CurrentUserController } from './me.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from '@/database/entities';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    MikroOrmModule.forFeature([User]),
  ],
  controllers: [CurrentUserController, UserController],
  providers: [UserService],
  exports: [UserService, MikroOrmModule],
})
export class UserModule {}

import { Module, forwardRef } from '@nestjs/common';
import { User } from '@/database/entities';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthModule } from '../auth/auth.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    MikroOrmModule.forFeature([User]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, MikroOrmModule],
})
export class UserModule {}

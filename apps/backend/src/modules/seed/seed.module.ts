import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from '@/database/entities';
import { UserModule } from '@/modules/user/user.module';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
import { EnvironmentGuard } from './guards';

@Module({
  imports: [MikroOrmModule.forFeature([User]), UserModule],
  controllers: [SeedController],
  providers: [SeedService, EnvironmentGuard],
  exports: [SeedService],
})
export class SeedModule {}

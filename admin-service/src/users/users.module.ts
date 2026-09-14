import { Module } from '@nestjs/common';
import { UsersClient } from './users.client';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersClient, UsersService],
  exports: [UsersService, UsersClient],
})
export class UsersModule {}

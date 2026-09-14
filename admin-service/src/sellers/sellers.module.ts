import { Module } from '@nestjs/common';
import { SellersClient } from './sellers.client';
import { SellersService } from './sellers.service';
import { SellersController } from './sellers.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SellersController],
  providers: [SellersClient, SellersService],
  exports: [SellersService, SellersClient],
})
export class SellersModule {}

import { Module } from '@nestjs/common';
import { CatalogClient } from './catalog.client';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CatalogController],
  providers: [CatalogClient, CatalogService],
  exports: [CatalogService, CatalogClient],
})
export class CatalogModule {}

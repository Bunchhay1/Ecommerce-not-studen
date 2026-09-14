import { Module } from '@nestjs/common';
import { ReviewsClient } from './reviews.client';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { AuditModule } from '../audit/audit.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [AuditModule, RolesModule],
  controllers: [ReviewsController],
  providers: [ReviewsClient, ReviewsService],
  exports: [ReviewsService, ReviewsClient],
})
export class ReviewsModule {}

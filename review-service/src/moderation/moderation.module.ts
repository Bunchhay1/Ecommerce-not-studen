import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { AdminReviewsController } from './admin-reviews.controller';
import { RatingsModule } from '../ratings/ratings.module';

@Module({
  imports: [RatingsModule],
  controllers: [AdminReviewsController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}

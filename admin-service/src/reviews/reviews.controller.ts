import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionCode } from '../common/utils/permissions.enum';
import { CurrentUser, AdminUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Admin Review Moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/admin/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @RequirePermissions(PermissionCode.REVIEW_READ)
  @ApiOperation({ summary: 'List customer reviews and ratings with moderation flags' })
  async getReviews(@Query() query: any) {
    return this.reviewsService.getReviews(query);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.REVIEW_READ)
  @ApiOperation({ summary: 'Get review details, rating, author, and report history' })
  async getReviewById(@Param('id') id: string) {
    return this.reviewsService.getReviewById(id);
  }

  @Post(':id/status')
  @RequirePermissions(PermissionCode.REVIEW_MODERATE)
  @ApiOperation({ summary: 'Approve, hide, or flag a review' })
  async updateReviewStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('reason') reason: string,
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.reviewsService.updateReviewStatus(
      id,
      status,
      reason || 'Moderation decision applied by administrator',
      admin,
      req.ip,
      req.get('user-agent'),
    );
  }

  @Delete(':id')
  @RequirePermissions(PermissionCode.REVIEW_DELETE)
  @ApiOperation({ summary: 'Permanently remove an abusive or fraudulent review' })
  async deleteReview(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.reviewsService.deleteReview(
      id,
      reason || 'Review removed for terms-of-service violation',
      admin,
      req.ip,
      req.get('user-agent'),
    );
  }
}

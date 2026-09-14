import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { UpdateReviewStatusDto, UpdateReportStatusDto } from './dto/update-review-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ReviewStatus, ReportStatus } from '@prisma/client';

@ApiTags('Admin / Moderation')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminReviewsController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('reviews')
  @ApiOperation({ summary: 'Admin list reviews with optional status filter' })
  async listReviews(
    @Query('status') status?: ReviewStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.moderationService.listReviews(status, page ? Number(page) : 1, limit ? Number(limit) : 50);
  }

  @Get('reviews/:id')
  @ApiOperation({ summary: 'Admin get review details' })
  async getReview(@Param('id') id: string) {
    return this.moderationService.getReview(id);
  }

  @Patch('reviews/:id/status')
  @ApiOperation({ summary: 'Moderate review status (PUBLISHED, REJECTED, HIDDEN)' })
  async updateReviewStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReviewStatusDto,
  ) {
    return this.moderationService.updateReviewStatus(id, dto.status);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Admin list review reports' })
  async listReports(
    @Query('status') status?: ReportStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.moderationService.listReports(status, page ? Number(page) : 1, limit ? Number(limit) : 50);
  }

  @Patch('reports/:id')
  @ApiOperation({ summary: 'Update report status (RESOLVED, DISMISSED)' })
  async updateReportStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReportStatusDto,
  ) {
    return this.moderationService.updateReportStatus(id, dto.status);
  }
}

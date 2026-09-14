import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService } from '../outbox/outbox.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportStatus, ReviewStatus } from '@prisma/client';
import { ErrorCodes } from '../common/error-codes';
import { ReviewEventType } from '../kafka/events';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxService: OutboxService,
    private readonly configService: ConfigService,
  ) {}

  async reportReview(reviewId: string, userId: string, dto: CreateReportDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.status === ReviewStatus.DELETED) {
      throw new NotFoundException({
        errorCode: ErrorCodes.REVIEW_NOT_FOUND,
        message: 'Review not found',
      });
    }

    const existingReport = await this.prisma.reviewReport.findFirst({
      where: {
        reviewId,
        userId,
        status: ReportStatus.PENDING,
      },
    });

    if (existingReport) {
      throw new BadRequestException({
        errorCode: ErrorCodes.REPORT_ALREADY_EXISTS,
        message: 'You have already submitted a pending report for this review',
      });
    }

    const threshold = this.configService.get<number>('review.flagThresholdReports', 3);

    return this.prisma.$transaction(async (tx) => {
      const report = await tx.reviewReport.create({
        data: {
          reviewId,
          userId,
          reason: dto.reason,
          description: dto.description,
          status: ReportStatus.PENDING,
        },
      });

      const updatedReview = await tx.review.update({
        where: { id: reviewId },
        data: { reportCount: { increment: 1 } },
      });

      // Auto-flag if exceeds threshold
      if (updatedReview.reportCount >= threshold && updatedReview.status === ReviewStatus.PUBLISHED) {
        await tx.review.update({
          where: { id: reviewId },
          data: { status: ReviewStatus.FLAGGED },
        });
      }

      await this.outboxService.createEvent(
        'ReviewReport',
        report.id,
        ReviewEventType.ReviewReported,
        {
          reportId: report.id,
          reviewId,
          userId,
          reason: report.reason,
        },
        tx,
      );

      return report;
    });
  }
}

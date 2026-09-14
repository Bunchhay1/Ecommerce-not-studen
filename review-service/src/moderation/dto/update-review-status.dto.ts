import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus, ReportStatus } from '@prisma/client';

export class UpdateReviewStatusDto {
  @ApiProperty({ enum: ReviewStatus, example: ReviewStatus.PUBLISHED })
  @IsEnum(ReviewStatus)
  @IsNotEmpty()
  status: ReviewStatus;

  @ApiPropertyOptional({ example: 'Approved after manual review' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateReportStatusDto {
  @ApiProperty({ enum: ReportStatus, example: ReportStatus.RESOLVED })
  @IsEnum(ReportStatus)
  @IsNotEmpty()
  status: ReportStatus;
}

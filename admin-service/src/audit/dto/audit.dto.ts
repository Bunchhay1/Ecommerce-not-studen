import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditStatus } from '@prisma/client';

export class CreateAuditLogDto {
  @ApiProperty({ description: 'ID of the admin performing the action' })
  @IsString()
  @IsNotEmpty()
  adminUserId: string;

  @ApiPropertyOptional({ description: 'Email of the admin' })
  @IsString()
  @IsOptional()
  adminEmail?: string;

  @ApiProperty({ description: 'Action performed', example: 'SELLER_SUSPENDED' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ description: 'Resource type', example: 'SELLER' })
  @IsString()
  @IsNotEmpty()
  resourceType: string;

  @ApiProperty({ description: 'Target resource ID' })
  @IsString()
  @IsNotEmpty()
  resourceId: string;

  @ApiPropertyOptional({ description: 'Previous state before change' })
  @IsOptional()
  oldValue?: any;

  @ApiPropertyOptional({ description: 'New state after change' })
  @IsOptional()
  newValue?: any;

  @ApiPropertyOptional({ description: 'Justification or reason' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: 'Client IP address' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Client User Agent' })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Correlation / Request ID' })
  @IsString()
  @IsOptional()
  requestId?: string;

  @ApiPropertyOptional({ enum: AuditStatus, default: AuditStatus.SUCCESS })
  @IsEnum(AuditStatus)
  @IsOptional()
  status?: AuditStatus;
}

export class QueryAuditLogDto {
  @ApiPropertyOptional({ description: 'Filter by admin user ID' })
  @IsString()
  @IsOptional()
  adminUserId?: string;

  @ApiPropertyOptional({ description: 'Filter by action (e.g. ORDER_CANCELLED)' })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional({ description: 'Filter by resource type (e.g. SELLER, ORDER)' })
  @IsString()
  @IsOptional()
  resourceType?: string;

  @ApiPropertyOptional({ description: 'Filter by resource ID' })
  @IsString()
  @IsOptional()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'Filter by start date (ISO string)' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (ISO string)' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}

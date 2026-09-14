import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewMediaItemDto {
  @ApiProperty({ example: 'IMAGE', enum: ['IMAGE', 'VIDEO'] })
  @IsString()
  @IsNotEmpty()
  mediaType: 'IMAGE' | 'VIDEO';

  @ApiProperty({ example: 'https://storage.marketplace.local/reviews/img-1.jpg' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ example: 'reviews/img-1.jpg' })
  @IsString()
  @IsOptional()
  storageKey?: string;
}

export class CreateReviewDto {
  @ApiProperty({ example: 'product-123' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ example: 'variant-456' })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiPropertyOptional({ example: 'order-789' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({ example: 'item-001' })
  @IsString()
  @IsOptional()
  orderItemId?: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Excellent product' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Very good quality and fast delivery.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ type: [ReviewMediaItemDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ReviewMediaItemDto)
  media?: ReviewMediaItemDto[];
}

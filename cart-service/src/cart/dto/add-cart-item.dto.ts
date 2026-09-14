import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ description: 'Product ID', example: 'prod-100' })
  @IsString()
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: string;

  @ApiProperty({ description: 'Product Variant ID / SKU', example: 'var-256-blk' })
  @IsString()
  @IsNotEmpty({ message: 'Variant ID is required' })
  variantId: string;

  @ApiProperty({ description: 'Quantity to add', example: 2, minimum: 1, maximum: 99 })
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(99, { message: 'Quantity cannot exceed 99 items per line' })
  quantity: number;
}

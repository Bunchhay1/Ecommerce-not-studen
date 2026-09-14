import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({ description: 'New item quantity', example: 3, minimum: 1, maximum: 99 })
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(99, { message: 'Quantity cannot exceed 99 items per line' })
  quantity: number;
}

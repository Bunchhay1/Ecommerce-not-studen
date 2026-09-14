import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { CartStatus } from '@prisma/client';

export class UpdateCartStatusDto {
  @ApiProperty({
    description: 'New cart status',
    enum: CartStatus,
    example: CartStatus.CHECKOUT,
  })
  @IsEnum(CartStatus, { message: 'Invalid cart status' })
  @IsNotEmpty({ message: 'Status is required' })
  status: CartStatus;
}

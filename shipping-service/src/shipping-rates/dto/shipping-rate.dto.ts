import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetShippingRatesQueryDto {
  @ApiPropertyOptional({ example: 'order-uuid-1' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({ example: 'Phnom Penh' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Cambodia' })
  @IsString()
  @IsOptional()
  country?: string;
}

export interface ShippingRateOption {
  method: string;
  fee: number;
  currency: string;
  estimatedDays: number;
  description: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelShipmentDto {
  @ApiPropertyOptional({ example: 'Customer cancelled order before pickup' })
  @IsString()
  @IsOptional()
  reason?: string;
}

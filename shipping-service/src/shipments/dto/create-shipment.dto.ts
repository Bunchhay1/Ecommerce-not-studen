import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ShippingMethod } from '@prisma/client';

export class ShippingAddressDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ example: '+85512345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123 Street Monivong' })
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Apartment 4B' })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ example: 'Phnom Penh' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: 'Chamkar Mon' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({ example: 'Phnom Penh' })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiProperty({ example: 'Cambodia' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: '12000' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;
}

export class ShipmentItemDto {
  @ApiProperty({ example: 'item-uuid-1' })
  @IsString()
  @IsNotEmpty()
  orderItemId: string;

  @ApiProperty({ example: 'prod-uuid-1' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ example: 'var-uuid-1' })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ example: 'IPHONE-16-BLK' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 'iPhone 16 Pro' })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateShipmentDto {
  @ApiProperty({ example: 'order-uuid-123' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiPropertyOptional({ enum: ShippingMethod, default: ShippingMethod.STANDARD })
  @IsEnum(ShippingMethod)
  @IsOptional()
  shippingMethod?: ShippingMethod;

  @ApiPropertyOptional({ example: 'LOCAL' })
  @IsString()
  @IsOptional()
  carrier?: string;

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  @IsNotEmpty()
  address: ShippingAddressDto;

  @ApiProperty({ type: [ShipmentItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShipmentItemDto)
  items: ShipmentItemDto[];

  @ApiPropertyOptional({ example: 'idemp-ship-001' })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}

import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleStatus } from '@prisma/client';

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name', example: 'WAREHOUSE_ADMIN' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Role description', example: 'Manages inventory and warehouse operations' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'List of permission codes to assign', example: ['INVENTORY_READ', 'INVENTORY_ADJUST'] })
  @IsArray()
  @IsOptional()
  permissionCodes?: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: 'Role description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: RoleStatus, description: 'Role status' })
  @IsEnum(RoleStatus)
  @IsOptional()
  status?: RoleStatus;

  @ApiPropertyOptional({ description: 'List of permission codes to assign' })
  @IsArray()
  @IsOptional()
  permissionCodes?: string[];
}

export class AssignRoleDto {
  @ApiProperty({ description: 'Target user ID' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'List of role names or role IDs to assign' })
  @IsArray()
  @IsNotEmpty()
  roleNames: string[];
}

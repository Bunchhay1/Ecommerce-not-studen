import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Headers,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionCode } from '../common/utils/permissions.enum';
import { CurrentUser, AdminUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Admin Inventory Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/admin/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermissions(PermissionCode.INVENTORY_READ)
  @ApiOperation({ summary: 'List inventory levels, reserved stock, and warehouse allocations' })
  async getInventory(@Query() query: any) {
    return this.inventoryService.getInventory(query);
  }

  @Get(':variantId')
  @RequirePermissions(PermissionCode.INVENTORY_READ)
  @ApiOperation({ summary: 'Get available and reserved stock for a product variant' })
  async getStock(@Param('variantId') variantId: string) {
    return this.inventoryService.getStock(variantId);
  }

  @Post(':variantId/adjust')
  @RequirePermissions(PermissionCode.INVENTORY_UPDATE)
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiOperation({ summary: 'Adjust stock count manually with audit reasoning' })
  async adjustStock(
    @Param('variantId') variantId: string,
    @Body('quantity') quantity: number,
    @Body('reason') reason: string,
    @Headers('Idempotency-Key') idempotencyKey: string,
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.inventoryService.adjustStock(
      variantId,
      quantity,
      reason || 'Manual stock correction by administrator',
      admin,
      idempotencyKey,
      req.ip,
      req.get('user-agent'),
    );
  }
}

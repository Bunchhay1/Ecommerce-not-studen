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
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionCode } from '../common/utils/permissions.enum';
import { CurrentUser, AdminUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Admin Order Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/admin/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @RequirePermissions(PermissionCode.ORDER_READ)
  @ApiOperation({ summary: 'List customer orders with status, date, and user filters' })
  async getOrders(@Query() query: any) {
    return this.ordersService.getOrders(query);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.ORDER_READ)
  @ApiOperation({ summary: 'Get order details, items, shipping, and payment status' })
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Post(':id/cancel')
  @RequirePermissions(PermissionCode.ORDER_CANCEL)
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiOperation({ summary: 'Cancel order and release inventory reservations' })
  async cancelOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Headers('Idempotency-Key') idempotencyKey: string,
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.ordersService.cancelOrder(
      id,
      reason || 'Order cancelled by administrator',
      admin,
      idempotencyKey,
      req.ip,
      req.get('user-agent'),
    );
  }

  @Post(':id/refund')
  @RequirePermissions(PermissionCode.ORDER_REFUND)
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiOperation({ summary: 'Process refund for order through payment workflow' })
  async refundOrder(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('reason') reason: string,
    @Headers('Idempotency-Key') idempotencyKey: string,
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.ordersService.refundOrder(
      id,
      amount,
      reason || 'Customer refund granted by administrator',
      admin,
      idempotencyKey,
      req.ip,
      req.get('user-agent'),
    );
  }
}

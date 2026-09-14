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
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionCode } from '../common/utils/permissions.enum';
import { CurrentUser, AdminUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Admin Payment Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/admin/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermissions(PermissionCode.PAYMENT_READ)
  @ApiOperation({ summary: 'List customer payment transactions and gateway statuses' })
  async getPayments(@Query() query: any) {
    return this.paymentsService.getPayments(query);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.PAYMENT_READ)
  @ApiOperation({ summary: 'Get transaction details, provider response, and receipt' })
  async getPaymentById(@Param('id') id: string) {
    return this.paymentsService.getPaymentById(id);
  }

  @Post(':id/refund')
  @RequirePermissions(PermissionCode.PAYMENT_REFUND)
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiOperation({ summary: 'Issue gateway refund for a payment' })
  async refundPayment(
    @Param('id') id: string,
    @Body('amount') amount: number,
    @Body('reason') reason: string,
    @Headers('Idempotency-Key') idempotencyKey: string,
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.paymentsService.refundPayment(
      id,
      amount,
      reason || 'Dispute resolution refund by administrator',
      admin,
      idempotencyKey,
      req.ip,
      req.get('user-agent'),
    );
  }
}

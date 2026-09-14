import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionCode } from '../common/utils/permissions.enum';
import { CurrentUser, AdminUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Admin Promotion Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/admin/promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  @RequirePermissions(PermissionCode.PROMOTION_READ)
  @ApiOperation({ summary: 'List coupon codes and promotional campaigns' })
  async getPromotions(@Query() query: any) {
    return this.promotionsService.getPromotions(query);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.PROMOTION_READ)
  @ApiOperation({ summary: 'Get campaign details, discount parameters, and usage stats' })
  async getPromotionById(@Param('id') id: string) {
    return this.promotionsService.getPromotionById(id);
  }

  @Post()
  @RequirePermissions(PermissionCode.PROMOTION_WRITE)
  @ApiOperation({ summary: 'Create new marketing promotion or coupon' })
  async createPromotion(
    @Body() body: any,
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.promotionsService.createPromotion(
      body,
      admin,
      req.ip,
      req.get('user-agent'),
    );
  }

  @Patch(':id/status')
  @RequirePermissions(PermissionCode.PROMOTION_WRITE)
  @ApiOperation({ summary: 'Enable or disable a promotion' })
  async updatePromotionStatus(
    @Param('id') id: string,
    @Body('active') active: boolean,
    @Body('reason') reason: string,
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.promotionsService.updatePromotionStatus(
      id,
      active,
      reason || 'Promotion status altered by administrator',
      admin,
      req.ip,
      req.get('user-agent'),
    );
  }
}

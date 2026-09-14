import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { SellersService } from './sellers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionCode } from '../common/utils/permissions.enum';
import { CurrentUser, AdminUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Admin Seller Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/admin/sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get()
  @RequirePermissions(PermissionCode.SELLER_READ)
  @ApiOperation({ summary: 'List marketplace sellers with optional status filtering' })
  async getSellers(@Query('status') status?: string) {
    return this.sellersService.getSellers(status);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.SELLER_READ)
  @ApiOperation({ summary: 'Get merchant profile and verification details' })
  async getSellerById(@Param('id') id: string) {
    return this.sellersService.getSellerById(id);
  }

  @Post(':id/verify')
  @RequirePermissions(PermissionCode.SELLER_VERIFY)
  @ApiOperation({ summary: 'Approve seller verification status' })
  async verifySeller(
    @Param('id') id: string,
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.sellersService.verifySeller(id, admin, req.ip, req.get('user-agent'));
  }

  @Post(':id/suspend')
  @RequirePermissions(PermissionCode.SELLER_SUSPEND)
  @ApiOperation({ summary: 'Suspend seller account and pause active marketplace listings' })
  async suspendSeller(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.sellersService.suspendSeller(id, reason || 'Policy compliance suspension', admin, req.ip, req.get('user-agent'));
  }

  @Post(':id/activate')
  @RequirePermissions(PermissionCode.SELLER_ACTIVATE)
  @ApiOperation({ summary: 'Reactivate suspended seller account' })
  async activateSeller(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.sellersService.activateSeller(id, reason || 'Account reinstated by admin', admin, req.ip, req.get('user-agent'));
  }
}

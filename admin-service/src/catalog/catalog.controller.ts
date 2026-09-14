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
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionCode } from '../common/utils/permissions.enum';
import { CurrentUser, AdminUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Admin Catalog & Product Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/admin/products')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @RequirePermissions(PermissionCode.PRODUCT_READ)
  @ApiOperation({ summary: 'List products across marketplace catalog' })
  async getProducts(@Query() query: any) {
    return this.catalogService.getProducts(query);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.PRODUCT_READ)
  @ApiOperation({ summary: 'Get product and variant details' })
  async getProductById(@Param('id') id: string) {
    return this.catalogService.getProductById(id);
  }

  @Post(':id/approve')
  @RequirePermissions(PermissionCode.PRODUCT_APPROVE)
  @ApiOperation({ summary: 'Approve pending product for public marketplace listing' })
  async approveProduct(
    @Param('id') id: string,
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.catalogService.approveProduct(id, admin, req.ip, req.get('user-agent'));
  }

  @Post(':id/archive')
  @RequirePermissions(PermissionCode.PRODUCT_ARCHIVE)
  @ApiOperation({ summary: 'Archive a product from marketplace catalog' })
  async archiveProduct(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.catalogService.archiveProduct(id, reason || 'Archived by administrator', admin, req.ip, req.get('user-agent'));
  }
}

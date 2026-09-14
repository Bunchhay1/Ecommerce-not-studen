import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionCode } from '../common/utils/permissions.enum';

@ApiTags('Admin Global Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/admin/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @RequirePermissions(PermissionCode.DASHBOARD_READ)
  @ApiOperation({ summary: 'Cross-entity search across users, orders, products, and sellers' })
  @ApiQuery({ name: 'q', required: true, description: 'Query string (email, order ID, SKU, seller name)' })
  async globalSearch(@Query('q') query: string) {
    return this.searchService.globalSearch(query);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionCode } from '../common/utils/permissions.enum';

@ApiTags('Admin Analytics & Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @RequirePermissions(PermissionCode.DASHBOARD_READ)
  @ApiOperation({ summary: 'Platform high-level overview: GMV, order volume, sellers, users' })
  async getDashboardSummary() {
    return this.dashboardService.getDashboardSummary();
  }

  @Get('alerts')
  @RequirePermissions(PermissionCode.DASHBOARD_READ)
  @ApiOperation({ summary: 'Operational pending action alerts (seller approvals, flagged reviews)' })
  async getOperationalAlerts() {
    return this.dashboardService.getOperationalAlerts();
  }

  @Get('trends')
  @RequirePermissions(PermissionCode.DASHBOARD_READ)
  @ApiOperation({ summary: 'Revenue and customer acquisition trend lines' })
  async getTrends(@Query('days') days?: number) {
    return this.dashboardService.getTrends(days ? Number(days) : 7);
  }
}

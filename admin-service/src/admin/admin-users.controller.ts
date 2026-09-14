import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionCode } from '../common/utils/permissions.enum';
import { CurrentUser, AdminUserPayload } from '../common/decorators/current-user.decorator';
import { AdminStatus } from '@prisma/client';

@ApiTags('Admin User & Account Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/admin/admin-users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @RequirePermissions(PermissionCode.ADMIN_USER_READ)
  @ApiOperation({ summary: 'List internal admin users, roles, and status' })
  async listAdminUsers() {
    return this.adminUsersService.listAdminUsers();
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.ADMIN_USER_READ)
  @ApiOperation({ summary: 'Get internal admin profile details' })
  async getAdminUser(@Param('id') id: string) {
    return this.adminUsersService.getAdminUser(id);
  }

  @Post()
  @RequirePermissions(PermissionCode.ADMIN_USER_MANAGE)
  @ApiOperation({ summary: 'Register an existing Auth user as an internal admin' })
  async createAdminUser(
    @Body() body: { userId: string; roleNames?: string[]; notes?: string },
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.adminUsersService.createAdminUser(
      body,
      admin,
      req.ip,
      req.get('user-agent'),
    );
  }

  @Patch(':id/status')
  @RequirePermissions(PermissionCode.ADMIN_USER_MANAGE)
  @ApiOperation({ summary: 'Update admin account status (ACTIVE, SUSPENDED, DEACTIVATED)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: AdminStatus,
    @Body('reason') reason: string,
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.adminUsersService.updateAdminStatus(
      id,
      status,
      reason || 'Status altered by administrator',
      admin,
      req.ip,
      req.get('user-agent'),
    );
  }

  @Patch(':id/roles')
  @RequirePermissions(PermissionCode.ROLE_MANAGE)
  @ApiOperation({ summary: 'Assign or replace role names for an internal admin' })
  async assignRoles(
    @Param('id') id: string,
    @Body('roleNames') roleNames: string[],
    @Body('reason') reason: string,
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.adminUsersService.assignRoles(
      id,
      roleNames,
      reason || 'Roles updated by Super Admin',
      admin,
      req.ip,
      req.get('user-agent'),
    );
  }
}

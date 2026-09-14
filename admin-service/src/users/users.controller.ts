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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionCode } from '../common/utils/permissions.enum';
import { CurrentUser, AdminUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Admin User Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions(PermissionCode.USER_READ)
  @ApiOperation({ summary: 'List customer and seller user accounts' })
  async getUsers(@Query() query: any) {
    return this.usersService.getUsers(query);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.USER_READ)
  @ApiOperation({ summary: 'Get user account details' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Post(':id/suspend')
  @RequirePermissions(PermissionCode.USER_SUSPEND)
  @ApiOperation({ summary: 'Suspend a user account with audit logging' })
  async suspendUser(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.usersService.suspendUser(id, reason || 'Administrative policy suspension', admin, req.ip, req.get('user-agent'));
  }

  @Post(':id/activate')
  @RequirePermissions(PermissionCode.USER_ACTIVATE)
  @ApiOperation({ summary: 'Reactivate a suspended user account' })
  async activateUser(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.usersService.activateUser(id, reason || 'Reinstated by administrator', admin, req.ip, req.get('user-agent'));
  }
}

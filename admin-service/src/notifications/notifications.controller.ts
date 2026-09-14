import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionCode } from '../common/utils/permissions.enum';
import { CurrentUser, AdminUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Admin Notification Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/admin/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @RequirePermissions(PermissionCode.NOTIFICATION_READ)
  @ApiOperation({ summary: 'List notification history and transmission records' })
  async getNotifications(@Query() query: any) {
    return this.notificationsService.getNotifications(query);
  }

  @Post('broadcast')
  @RequirePermissions(PermissionCode.NOTIFICATION_SEND)
  @ApiOperation({ summary: 'Send platform announcement or push broadcast' })
  async sendBroadcast(
    @Body() body: { title: string; message: string; targetGroup: string; channel: string },
    @CurrentUser() admin: AdminUserPayload,
    @Req() req: Request,
  ) {
    return this.notificationsService.sendBroadcast(
      body,
      admin,
      req.ip,
      req.get('user-agent'),
    );
  }
}

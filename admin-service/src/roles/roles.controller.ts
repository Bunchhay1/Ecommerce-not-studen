import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from './dto/role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionCode } from '../common/utils/permissions.enum';

@ApiTags('Admin Roles & Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/admin/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions(PermissionCode.ROLE_MANAGE)
  @ApiOperation({ summary: 'List all system roles and their assigned permissions' })
  async getRoles() {
    return this.rolesService.getAllRoles();
  }

  @Get('permissions')
  @RequirePermissions(PermissionCode.ROLE_MANAGE)
  @ApiOperation({ summary: 'List all available permission codes' })
  async getPermissions() {
    return this.rolesService.getAllPermissions();
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.ROLE_MANAGE)
  @ApiOperation({ summary: 'Get role details by ID' })
  async getRoleById(@Param('id') id: string) {
    return this.rolesService.getRoleById(id);
  }

  @Post()
  @RequirePermissions(PermissionCode.ROLE_MANAGE)
  @ApiOperation({ summary: 'Create a new administrative role' })
  async createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.ROLE_MANAGE)
  @ApiOperation({ summary: 'Update a role or its permissions' })
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(id, dto);
  }

  @Post('assign')
  @RequirePermissions(PermissionCode.ADMIN_USER_MANAGE)
  @ApiOperation({ summary: 'Assign roles to a user' })
  async assignRoles(@Body() dto: AssignRoleDto) {
    return this.rolesService.assignRolesToUser(dto);
  }
}

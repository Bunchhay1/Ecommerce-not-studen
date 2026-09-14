import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';
import { PermissionCode } from '../../common/utils/permissions.enum';
import { AdminRole } from '../../common/utils/roles.enum';
import { RolesService } from '../../roles/roles.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(forwardRef(() => RolesService))
    private rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<(PermissionCode | string)[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.userId) {
      throw new ForbiddenException('Access denied: Unauthenticated admin user');
    }

    // SUPER_ADMIN bypasses granular permission check
    if (user.roles && user.roles.includes(AdminRole.SUPER_ADMIN)) {
      return true;
    }

    // Resolve user's permissions via rolesService (which queries cache / DB)
    const userPermissions = await this.rolesService.getUserPermissions(user.userId, user.roles);

    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasAllPermissions) {
      const missing = requiredPermissions.filter((p) => !userPermissions.includes(p));
      throw new ForbiddenException(
        `Insufficient permissions. Missing: [${missing.join(', ')}]`,
      );
    }

    return true;
  }
}

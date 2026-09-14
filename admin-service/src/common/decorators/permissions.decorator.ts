import { SetMetadata } from '@nestjs/common';
import { PermissionCode } from '../utils/permissions.enum';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: (PermissionCode | string)[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

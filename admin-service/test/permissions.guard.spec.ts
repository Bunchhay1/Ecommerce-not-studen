import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { PermissionCode } from '../src/common/utils/permissions.enum';
import { RoleName } from '../src/common/utils/roles.enum';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let mockRolesService: any;

  beforeEach(() => {
    reflector = new Reflector();
    mockRolesService = {
      getUserPermissions: jest.fn(),
    };
    guard = new PermissionsGuard(reflector, mockRolesService);
  });

  function createMockContext(user: any) {
    return {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access if no permissions are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const context = createMockContext({ userId: 'u1' });
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user is SUPER_ADMIN', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([PermissionCode.ORDER_CANCEL]);
    const context = createMockContext({ userId: 'u1', roles: [RoleName.SUPER_ADMIN] });
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has the required permission', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([PermissionCode.ORDER_READ]);
    mockRolesService.getUserPermissions.mockResolvedValue([PermissionCode.ORDER_READ, PermissionCode.USER_READ]);

    const context = createMockContext({ userId: 'u2', roles: [RoleName.CUSTOMER_SUPPORT] });
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks the required permission', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([PermissionCode.ORDER_CANCEL]);
    mockRolesService.getUserPermissions.mockResolvedValue([PermissionCode.ORDER_READ]);

    const context = createMockContext({ userId: 'u2', roles: [RoleName.CUSTOMER_SUPPORT] });
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});

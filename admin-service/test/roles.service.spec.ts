import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from '../src/roles/roles.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { RoleName } from '../src/common/utils/roles.enum';
import { PermissionCode } from '../src/common/utils/permissions.enum';

describe('RolesService', () => {
  let service: RolesService;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(async () => {
    mockPrisma = {
      role: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
      permission: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      adminUser: {
        findUnique: jest.fn(),
      },
    };

    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all permission codes for SUPER_ADMIN role in fallback mode', async () => {
    const permissions = await service.getUserPermissions('user-super-admin', [RoleName.SUPER_ADMIN]);
    expect(permissions).toContain(PermissionCode.USER_READ);
    expect(permissions).toContain(PermissionCode.ORDER_CANCEL);
    expect(permissions).toContain(PermissionCode.SELLER_VERIFY);
    expect(permissions.length).toBe(Object.keys(PermissionCode).length);
  });

  it('should return restricted permissions for CUSTOMER_SUPPORT', async () => {
    const permissions = await service.getUserPermissions('user-support', [RoleName.CUSTOMER_SUPPORT]);
    expect(permissions).toContain(PermissionCode.USER_READ);
    expect(permissions).toContain(PermissionCode.ORDER_READ);
    expect(permissions).not.toContain(PermissionCode.ROLE_MANAGE);
    expect(permissions).not.toContain(PermissionCode.PRODUCT_DELETE);
  });

  it('should cache permissions in redis when fetched', async () => {
    await service.getUserPermissions('user-super-admin', [RoleName.SUPER_ADMIN]);
    expect(mockRedis.set).toHaveBeenCalledWith(
      'admin:permissions:user-super-admin',
      expect.any(Array),
      900,
    );
  });
});

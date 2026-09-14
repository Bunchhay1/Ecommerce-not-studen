import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from './dto/role.dto';
import { AdminRole } from '../common/utils/roles.enum';
import { PermissionCode } from '../common/utils/permissions.enum';
import { RoleStatus, AdminStatus } from '@prisma/client';

@Injectable()
export class RolesService implements OnModuleInit {
  private readonly logger = new Logger(RolesService.name);

  // In-memory fallback matrix for all 9 standard roles
  public static readonly DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
    [AdminRole.SUPER_ADMIN]: Object.values(PermissionCode),
    [AdminRole.ADMIN]: [
      PermissionCode.USER_READ,
      PermissionCode.USER_UPDATE,
      PermissionCode.USER_SUSPEND,
      PermissionCode.USER_ACTIVATE,
      PermissionCode.SELLER_READ,
      PermissionCode.SELLER_VERIFY,
      PermissionCode.SELLER_SUSPEND,
      PermissionCode.SELLER_ACTIVATE,
      PermissionCode.SELLER_COMMISSION_MANAGE,
      PermissionCode.PRODUCT_READ,
      PermissionCode.PRODUCT_APPROVE,
      PermissionCode.PRODUCT_ARCHIVE,
      PermissionCode.ORDER_READ,
      PermissionCode.ORDER_UPDATE,
      PermissionCode.ORDER_CANCEL,
      PermissionCode.ORDER_REFUND,
      PermissionCode.INVENTORY_READ,
      PermissionCode.INVENTORY_ADJUST,
      PermissionCode.PAYMENT_READ,
      PermissionCode.PAYMENT_REFUND,
      PermissionCode.REVIEW_READ,
      PermissionCode.REVIEW_MODERATE,
      PermissionCode.PROMOTION_READ,
      PermissionCode.PROMOTION_CREATE,
      PermissionCode.PROMOTION_UPDATE,
      PermissionCode.PROMOTION_ACTIVATE,
      PermissionCode.PROMOTION_PAUSE,
      PermissionCode.NOTIFICATION_READ,
      PermissionCode.NOTIFICATION_SEND,
      PermissionCode.DASHBOARD_READ,
      PermissionCode.METRICS_READ,
      PermissionCode.AUDIT_READ,
      PermissionCode.ROLE_MANAGE,
    ],
    [AdminRole.MODERATOR]: [
      PermissionCode.PRODUCT_READ,
      PermissionCode.PRODUCT_APPROVE,
      PermissionCode.REVIEW_READ,
      PermissionCode.REVIEW_MODERATE,
      PermissionCode.SELLER_READ,
    ],
    [AdminRole.SUPPORT]: [
      PermissionCode.USER_READ,
      PermissionCode.ORDER_READ,
      PermissionCode.ORDER_UPDATE,
      PermissionCode.ORDER_CANCEL,
      PermissionCode.PAYMENT_READ,
      PermissionCode.NOTIFICATION_READ,
      PermissionCode.SELLER_READ,
    ],
    [AdminRole.CATALOG_ADMIN]: [
      PermissionCode.PRODUCT_READ,
      PermissionCode.PRODUCT_CREATE,
      PermissionCode.PRODUCT_UPDATE,
      PermissionCode.PRODUCT_DELETE,
      PermissionCode.PRODUCT_APPROVE,
      PermissionCode.PRODUCT_ARCHIVE,
    ],
    [AdminRole.SELLER_ADMIN]: [
      PermissionCode.SELLER_READ,
      PermissionCode.SELLER_VERIFY,
      PermissionCode.SELLER_SUSPEND,
      PermissionCode.SELLER_ACTIVATE,
      PermissionCode.SELLER_COMMISSION_MANAGE,
    ],
    [AdminRole.ORDER_ADMIN]: [
      PermissionCode.ORDER_READ,
      PermissionCode.ORDER_UPDATE,
      PermissionCode.ORDER_CANCEL,
      PermissionCode.ORDER_REFUND,
    ],
    [AdminRole.FINANCE_ADMIN]: [
      PermissionCode.PAYMENT_READ,
      PermissionCode.PAYMENT_REFUND,
      PermissionCode.ORDER_READ,
      PermissionCode.SELLER_COMMISSION_MANAGE,
      PermissionCode.METRICS_READ,
    ],
    [AdminRole.MARKETING_ADMIN]: [
      PermissionCode.PROMOTION_READ,
      PermissionCode.PROMOTION_CREATE,
      PermissionCode.PROMOTION_UPDATE,
      PermissionCode.PROMOTION_ACTIVATE,
      PermissionCode.PROMOTION_PAUSE,
      PermissionCode.NOTIFICATION_READ,
      PermissionCode.NOTIFICATION_SEND,
      PermissionCode.DASHBOARD_READ,
    ],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultRolesAndPermissions();
  }

  async seedDefaultRolesAndPermissions() {
    try {
      // 1. Seed Permissions
      const allPermissions = Object.values(PermissionCode);
      for (const code of allPermissions) {
        const category = code.split('_')[0] || 'SYSTEM';
        await this.prisma.permission.upsert({
          where: { code },
          update: {},
          create: {
            code,
            description: `Permission to execute ${code.toLowerCase().replace(/_/g, ' ')}`,
            category,
          },
        });
      }

      // 2. Seed Default Roles and map permissions
      for (const [roleName, permissions] of Object.entries(RolesService.DEFAULT_ROLE_PERMISSIONS)) {
        const role = await this.prisma.role.upsert({
          where: { name: roleName },
          update: {},
          create: {
            name: roleName,
            description: `Standard system role for ${roleName}`,
            isSystem: true,
            status: RoleStatus.ACTIVE,
          },
        });

        // Map permissions to role
        for (const permCode of permissions) {
          const perm = await this.prisma.permission.findUnique({ where: { code: permCode } });
          if (perm) {
            await this.prisma.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId: role.id,
                  permissionId: perm.id,
                },
              },
              update: {},
              create: {
                roleId: role.id,
                permissionId: perm.id,
              },
            });
          }
        }
      }

      this.logger.log('Default Roles and Permissions verified in database');
    } catch (err: any) {
      this.logger.warn(`Role/Permission seeding skipped (DB connection deferred): ${err.message}`);
    }
  }

  async getAllRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async createRole(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Role '${dto.name}' already exists`);
    }

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        status: RoleStatus.ACTIVE,
        isSystem: false,
      },
    });

    if (dto.permissionCodes && dto.permissionCodes.length > 0) {
      const permissions = await this.prisma.permission.findMany({
        where: { code: { in: dto.permissionCodes } },
      });

      for (const p of permissions) {
        await this.prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: p.id,
          },
        });
      }
    }

    await this.redis.deletePattern('admin:permissions:*');
    return this.getRoleById(role.id);
  }

  async getRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }

    return role;
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    const role = await this.getRoleById(id);

    await this.prisma.role.update({
      where: { id },
      data: {
        description: dto.description,
        status: dto.status,
      },
    });

    if (dto.permissionCodes) {
      // Clear existing and assign new
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
      const permissions = await this.prisma.permission.findMany({
        where: { code: { in: dto.permissionCodes } },
      });

      for (const p of permissions) {
        await this.prisma.rolePermission.create({
          data: {
            roleId: id,
            permissionId: p.id,
          },
        });
      }
    }

    await this.redis.deletePattern('admin:permissions:*');
    return this.getRoleById(id);
  }

  async assignRolesToUser(dto: AssignRoleDto) {
    let adminUser = await this.prisma.adminUser.findUnique({
      where: { userId: dto.userId },
    });

    if (!adminUser) {
      adminUser = await this.prisma.adminUser.create({
        data: {
          userId: dto.userId,
          status: AdminStatus.ACTIVE,
        },
      });
    }

    // Resolve roles
    const roles = await this.prisma.role.findMany({
      where: {
        OR: [
          { name: { in: dto.roleNames } },
          { id: { in: dto.roleNames } },
        ],
      },
    });

    await this.prisma.adminUserRole.deleteMany({
      where: { adminUserId: adminUser.id },
    });

    for (const r of roles) {
      await this.prisma.adminUserRole.create({
        data: {
          adminUserId: adminUser.id,
          roleId: r.id,
        },
      });
    }

    await this.redis.del(`admin:permissions:${dto.userId}`);
    return {
      userId: dto.userId,
      assignedRoles: roles.map((r) => r.name),
    };
  }

  async getUserPermissions(userId: string, roleNames: string[] = []): Promise<string[]> {
    const cacheKey = `admin:permissions:${userId}`;
    const cached = await this.redis.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const permissionSet = new Set<string>();

    try {
      // 1. Check DB admin_user_roles if provisioned
      const adminUser = await this.prisma.adminUser.findUnique({
        where: { userId },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (adminUser && adminUser.status === AdminStatus.ACTIVE) {
        for (const userRole of adminUser.roles) {
          if (userRole.role.status === RoleStatus.ACTIVE) {
            for (const rp of userRole.role.permissions) {
              permissionSet.add(rp.permission.code);
            }
          }
        }
      }
    } catch (err: any) {
      this.logger.debug(`DB lookup for permissions deferred: ${err.message}`);
    }

    // 2. Fallback to roles provided in the JWT payload
    if (permissionSet.size === 0 && roleNames && roleNames.length > 0) {
      for (const role of roleNames) {
        const defaultPerms = RolesService.DEFAULT_ROLE_PERMISSIONS[role];
        if (defaultPerms) {
          defaultPerms.forEach((p) => permissionSet.add(p));
        }
      }
    }

    const result = Array.from(permissionSet);
    await this.redis.set(cacheKey, result, 900); // 15 mins cache
    return result;
  }
}

import { PrismaClient, RoleStatus, AdminStatus } from '@prisma/client';
import { PermissionCode } from '../src/common/utils/permissions.enum';
import { AdminRole } from '../src/common/utils/roles.enum';
import { RolesService } from '../src/roles/roles.service';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding permissions, roles, and initial admin user...');

  // 1. Seed Permissions
  const permissions = Object.values(PermissionCode);
  for (const code of permissions) {
    const category = code.split('_')[0] || 'SYSTEM';
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: {
        code,
        description: `Permission to execute ${code.toLowerCase().replace(/_/g, ' ')}`,
        category,
      },
    });
  }
  console.log(`Seeded ${permissions.length} granular permissions.`);

  // 2. Seed Default Roles and assign permissions
  for (const [roleName, perms] of Object.entries(RolesService.DEFAULT_ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `System role for ${roleName}`,
        isSystem: true,
        status: RoleStatus.ACTIVE,
      },
    });

    for (const permCode of perms) {
      const p = await prisma.permission.findUnique({ where: { code: permCode } });
      if (p) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: p.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: p.id,
          },
        });
      }
    }
  }
  console.log('Seeded 9 standard administrative roles with mapped permissions.');

  // 3. Seed Default Super Admin Account
  const defaultAdmin = await prisma.adminUser.upsert({
    where: { userId: 'admin-0000-0000-0000-000000000001' },
    update: {},
    create: {
      userId: 'admin-0000-0000-0000-000000000001',
      status: AdminStatus.ACTIVE,
      notes: 'Initial Platform Super Admin',
    },
  });

  const superAdminRole = await prisma.role.findUnique({ where: { name: AdminRole.SUPER_ADMIN } });
  if (superAdminRole) {
    await prisma.adminUserRole.upsert({
      where: {
        adminUserId_roleId: {
          adminUserId: defaultAdmin.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        adminUserId: defaultAdmin.id,
        roleId: superAdminRole.id,
      },
    });
  }

  console.log('Seeded default SUPER_ADMIN user.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

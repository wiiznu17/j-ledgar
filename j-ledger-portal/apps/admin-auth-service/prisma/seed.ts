import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create permissions
  const permissions = [
    { name: 'staff:read', description: 'View staff accounts', resource: 'staff', action: 'read' },
    { name: 'staff:create', description: 'Create staff accounts', resource: 'staff', action: 'create' },
    { name: 'staff:update', description: 'Update staff accounts', resource: 'staff', action: 'update' },
    { name: 'staff:delete', description: 'Delete staff accounts', resource: 'staff', action: 'delete' },
    { name: 'role:read', description: 'View roles', resource: 'role', action: 'read' },
    { name: 'role:create', description: 'Create roles', resource: 'role', action: 'create' },
    { name: 'role:update', description: 'Update roles', resource: 'role', action: 'update' },
    { name: 'role:delete', description: 'Delete roles', resource: 'role', action: 'delete' },
    { name: 'permission:read', description: 'View permissions', resource: 'permission', action: 'read' },
    { name: 'permission:create', description: 'Create permissions', resource: 'permission', action: 'create' },
    { name: 'permission:update', description: 'Update permissions', resource: 'permission', action: 'update' },
    { name: 'permission:delete', description: 'Delete permissions', resource: 'permission', action: 'delete' },
    { name: 'user:read', description: 'View users', resource: 'user', action: 'read' },
    { name: 'user:update', description: 'Update users', resource: 'user', action: 'update' },
    { name: 'kyc:read', description: 'View KYC documents', resource: 'kyc', action: 'read' },
    { name: 'kyc:approve', description: 'Approve KYC', resource: 'kyc', action: 'approve' },
    { name: 'kyc:reject', description: 'Reject KYC', resource: 'kyc', action: 'reject' },
    { name: 'transaction:read', description: 'View transactions', resource: 'transaction', action: 'read' },
    { name: 'transaction:reverse', description: 'Reverse transactions', resource: 'transaction', action: 'reverse' },
    { name: 'wallet:read', description: 'View wallets', resource: 'wallet', action: 'read' },
    { name: 'wallet:adjust', description: 'Adjust wallet balance', resource: 'wallet', action: 'adjust' },
  ];

  const createdPermissions = [];
  for (const permission of permissions) {
    const created = await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
    createdPermissions.push(created);
  }
  console.log(`Created ${createdPermissions.length} permissions`);

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Full system access',
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      description: 'Manager access with limited permissions',
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'Staff' },
    update: {},
    create: {
      name: 'Staff',
      description: 'Basic staff access',
    },
  });

  console.log('Created 3 roles: Admin, Manager, Staff');

  // Assign all permissions to Admin role
  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`Assigned all permissions to Admin role`);

  // Assign limited permissions to Manager role
  const managerPermissions = createdPermissions.filter((p) =>
    [
      'staff:read',
      'user:read',
      'user:update',
      'kyc:read',
      'kyc:approve',
      'kyc:reject',
      'transaction:read',
      'wallet:read',
    ].includes(p.name),
  );

  for (const permission of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`Assigned ${managerPermissions.length} permissions to Manager role`);

  // Assign basic permissions to Staff role
  const staffPermissions = createdPermissions.filter((p) =>
    ['user:read', 'kyc:read', 'transaction:read'].includes(p.name),
  );

  for (const permission of staffPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: staffRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: staffRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`Assigned ${staffPermissions.length} permissions to Staff role`);

  // Create default admin staff
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminStaff = await prisma.staff.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@jledger.com',
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true,
    },
  });

  // Assign Admin role to admin staff
  await prisma.staffRole.upsert({
    where: {
      staffId_roleId: {
        staffId: adminStaff.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      staffId: adminStaff.id,
      roleId: adminRole.id,
    },
  });

  console.log('Created default admin staff (username: admin, password: admin123)');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

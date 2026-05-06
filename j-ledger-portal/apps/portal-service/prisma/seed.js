const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🚀 Starting comprehensive RBAC seed...');

  // 1. Define Permissions (Matching Permission enum in @repo/dto)
  const permissions = [
    // Transaction Monitoring
    { name: 'VIEW_TRANSACTIONS', resource: 'TRANSACTION', action: 'VIEW', description: 'View transaction logs' },
    { name: 'VIEW_TRANSACTION_DETAILS', resource: 'TRANSACTION', action: 'VIEW_DETAIL', description: 'View granular transaction details' },
    { name: 'VIEW_LEDGER_ENTRIES', resource: 'TRANSACTION', action: 'VIEW_LEDGER', description: 'View double-entry ledger records' },

    // AML
    { name: 'VIEW_SUSPICIOUS_ACTIVITIES', resource: 'AML', action: 'VIEW', description: 'View flagged suspicious activities' },
    { name: 'REVIEW_SUSPICIOUS_ACTIVITIES', resource: 'AML', action: 'REVIEW', description: 'Update status of suspicious activities' },
    { name: 'REPORT_TO_AMLO', resource: 'AML', action: 'REPORT', description: 'Send official report to AMLO' },

    // Account Management
    { name: 'VIEW_ACCOUNTS', resource: 'ACCOUNT', action: 'VIEW', description: 'View user wallets and accounts' },
    { name: 'FREEZE_ACCOUNTS', resource: 'ACCOUNT', action: 'FREEZE', description: 'Freeze user wallets' },
    { name: 'UNFREEZE_ACCOUNTS', resource: 'ACCOUNT', action: 'UNFREEZE', description: 'Unfreeze user wallets' },

    // User Management
    { name: 'VIEW_USERS', resource: 'USER', action: 'VIEW', description: 'View system users' },
    { name: 'CREATE_ADMINS', resource: 'ADMIN', action: 'CREATE', description: 'Create new administrative staff' },
    { name: 'DELETE_ADMINS', resource: 'ADMIN', action: 'DELETE', description: 'Remove administrative staff' },

    // Audit & System
    { name: 'VIEW_AUDIT_LOGS', resource: 'AUDIT', action: 'VIEW', description: 'View system audit logs' },
    { name: 'VIEW_DASHBOARD', resource: 'DASHBOARD', action: 'VIEW', description: 'Access administrative dashboard' },
  ];

  console.log('📦 Seeding permissions...');
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: p,
      create: p,
    });
  }

  // 2. Define Roles
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Full system access' },
    { name: 'AUDITOR', description: 'View-only access to financial and audit records' },
    { name: 'SUPPORT_AGENT', description: 'Limited access to user management and transactions' },
    { name: 'COMPLIANCE_OFFICER', description: 'Dedicated access to KYC and AML monitoring' },
  ];

  console.log('👑 Seeding roles...');
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  // 3. Link Permissions to Roles (RolePermission)
  const rolePermissionsMapping = {
    SUPER_ADMIN: permissions.map(p => p.name), // Everything
    AUDITOR: [
      'VIEW_TRANSACTIONS',
      'VIEW_TRANSACTION_DETAILS',
      'VIEW_LEDGER_ENTRIES',
      'VIEW_AUDIT_LOGS',
      'VIEW_DASHBOARD'
    ],
    SUPPORT_AGENT: [
      'VIEW_USERS',
      'VIEW_ACCOUNTS',
      'VIEW_TRANSACTIONS',
      'VIEW_DASHBOARD'
    ],
    COMPLIANCE_OFFICER: [
      'VIEW_SUSPICIOUS_ACTIVITIES',
      'REVIEW_SUSPICIOUS_ACTIVITIES',
      'REPORT_TO_AMLO',
      'VIEW_USERS',
      'VIEW_ACCOUNTS',
      'VIEW_TRANSACTIONS'
    ]
  };

  console.log('🔗 Linking permissions to roles...');
  for (const [roleName, perms] of Object.entries(rolePermissionsMapping)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    
    // Clear existing permissions for this role to ensure a clean sync
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    for (const permName of perms) {
      const permission = await prisma.permission.findUnique({ where: { name: permName } });
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }
  }

  // 4. Create/Update Default Admin User
  const adminPassword = await bcrypt.hash('password123', 10);
  const adminUser = await prisma.staff.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      email: 'admin@jledger.io',
      firstName: 'System',
      lastName: 'Admin',
      isActive: true,
    },
  });

  // Assign SUPER_ADMIN role to default admin
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  await prisma.staffRole.upsert({
    where: {
      staffId_roleId: {
        staffId: adminUser.id,
        roleId: superAdminRole.id
      }
    },
    update: {},
    create: {
      staffId: adminUser.id,
      roleId: superAdminRole.id
    }
  });

  console.log('✅ RBAC Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

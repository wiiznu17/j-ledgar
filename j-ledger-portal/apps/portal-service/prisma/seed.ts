import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting comprehensive RBAC seed...');

  // 1. Define All Permissions
  const permissionsList = [
    // Staff & Admin Management
    { name: 'CREATE_ADMINS', resource: 'staff', action: 'create', description: 'Create new administrator accounts' },
    { name: 'DELETE_ADMINS', resource: 'staff', action: 'delete', description: 'Remove administrator accounts' },
    { name: 'MANAGE_STAFF', resource: 'staff', action: 'update', description: 'Update staff profile information' },
    { name: 'RESET_STAFF_PASSWORD', resource: 'staff', action: 'reset_password', description: 'Reset staff account passwords' },
    { name: 'DEACTIVATE_STAFF', resource: 'staff', action: 'deactivate', description: 'Deactivate staff accounts' },
    { name: 'REACTIVATE_STAFF', resource: 'staff', action: 'activate', description: 'Reactivate staff accounts' },
    { name: 'ASSIGN_STAFF_ROLES', resource: 'staff', action: 'assign_role', description: 'Assign security roles to staff' },

    // KYC & User Identity
    { name: 'VIEW_KYC', resource: 'kyc', action: 'read', description: 'View user KYC documents and status' },
    { name: 'APPROVE_KYC', resource: 'kyc', action: 'approve', description: 'Approve user KYC verification' },
    { name: 'REJECT_KYC', resource: 'kyc', action: 'reject', description: 'Reject user KYC verification' },
    { name: 'VIEW_USERS', resource: 'user', action: 'read', description: 'View customer user profiles' },
    { name: 'FREEZE_USERS', resource: 'user', action: 'freeze', description: 'Freeze customer accounts' },
    { name: 'UNFREEZE_USERS', resource: 'user', action: 'unfreeze', description: 'Unfreeze customer accounts' },

    // System & Security
    { name: 'MANAGE_SYSTEM_ROLES', resource: 'system', action: 'manage', description: 'Create and edit system roles' },
    { name: 'MANAGE_SYSTEM_PERMISSIONS', resource: 'system', action: 'manage', description: 'Manage system-wide permissions' },
    { name: 'VIEW_AUDIT_LOGS', resource: 'audit', action: 'read', description: 'View system administrative audit logs' },
    { name: 'VIEW_DASHBOARD', resource: 'dashboard', action: 'read', description: 'Access administrative dashboard' },
    { name: 'VIEW_STATISTICS', resource: 'stats', action: 'read', description: 'View operational statistics' },

    // Financial Monitoring
    { name: 'VIEW_TRANSACTIONS', resource: 'transaction', action: 'read', description: 'Monitor financial transactions' },
    { name: 'VIEW_TRANSACTION_DETAILS', resource: 'transaction', action: 'read', description: 'View detailed transaction data' },
    { name: 'VIEW_LEDGER_ENTRIES', resource: 'ledger', action: 'read', description: 'View accounting ledger entries' },
    { name: 'VIEW_ACCOUNTS', resource: 'account', action: 'read', description: 'View customer ledger accounts' },
    { name: 'FREEZE_ACCOUNTS', resource: 'account', action: 'freeze', description: 'Freeze financial accounts' },
    { name: 'UNFREEZE_ACCOUNTS', resource: 'account', action: 'unfreeze', description: 'Unfreeze financial accounts' },
    { name: 'VIEW_RECONCILIATION_REPORTS', resource: 'reconciliation', action: 'read', description: 'View reconciliation reports' },
    { name: 'RUN_RECONCILIATION', resource: 'reconciliation', action: 'execute', description: 'Trigger system reconciliation' },

    // AML (From seed.js)
    { name: 'VIEW_SUSPICIOUS_ACTIVITIES', resource: 'AML', action: 'VIEW', description: 'View flagged suspicious activities' },
    { name: 'REVIEW_SUSPICIOUS_ACTIVITIES', resource: 'AML', action: 'REVIEW', description: 'Update status of suspicious activities' },
    { name: 'REPORT_TO_AMLO', resource: 'AML', action: 'REPORT', description: 'Send official report to AMLO' },
  ];

  console.log('📦 Seeding permissions...');
  const createdPermissionsMap = new Map();
  for (const p of permissionsList) {
    const permission = await prisma.permission.upsert({
      where: { name: p.name },
      update: p,
      create: p,
    });
    createdPermissionsMap.set(p.name, permission.id);
  }

  // 2. Define Roles
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Full system access', isSystem: true },
    { name: 'AUDITOR', description: 'View-only access to financial and audit records', isSystem: true },
    { name: 'SUPPORT_AGENT', description: 'Limited access to user management and transactions', isSystem: true },
    { name: 'COMPLIANCE_OFFICER', description: 'Dedicated access to KYC and AML monitoring', isSystem: true },
  ];

  console.log('👑 Seeding roles...');
  const createdRolesMap = new Map();
  for (const role of roles) {
    const r = await prisma.role.upsert({
      where: { name: role.name },
      update: { 
        description: role.description,
        isSystem: role.isSystem 
      },
      create: role,
    });
    createdRolesMap.set(role.name, r.id);
  }

  // 3. Link Permissions to Roles (RolePermission)
  const rolePermissionsMapping = {
    SUPER_ADMIN: permissionsList.map(p => p.name), // Everything
    AUDITOR: [
      'VIEW_TRANSACTIONS',
      'VIEW_TRANSACTION_DETAILS',
      'VIEW_LEDGER_ENTRIES',
      'VIEW_AUDIT_LOGS',
      'VIEW_DASHBOARD',
      'VIEW_STATISTICS'
    ],
    SUPPORT_AGENT: [
      'VIEW_USERS',
      'VIEW_ACCOUNTS',
      'VIEW_TRANSACTIONS',
      'VIEW_DASHBOARD',
      'VIEW_KYC'
    ],
    COMPLIANCE_OFFICER: [
      'VIEW_SUSPICIOUS_ACTIVITIES',
      'REVIEW_SUSPICIOUS_ACTIVITIES',
      'REPORT_TO_AMLO',
      'VIEW_USERS',
      'VIEW_ACCOUNTS',
      'VIEW_TRANSACTIONS',
      'VIEW_KYC',
      'APPROVE_KYC',
      'REJECT_KYC'
    ]
  };

  console.log('🔗 Linking permissions to roles...');
  for (const [roleName, perms] of Object.entries(rolePermissionsMapping)) {
    const roleId = createdRolesMap.get(roleName);
    if (!roleId) continue;

    // Clear existing permissions for this role to ensure a clean sync (idempotent)
    await prisma.rolePermission.deleteMany({ where: { roleId } });

    for (const permName of perms) {
      const permissionId = createdPermissionsMap.get(permName);
      if (permissionId) {
        await prisma.rolePermission.create({
          data: {
            roleId,
            permissionId
          }
        });
      }
    }
  }

  // 4. Create/Update Default Admin User
  const adminPassword = await bcrypt.hash('password123', 10);
  const adminUser = await prisma.staff.upsert({
    where: { username: 'admin' },
    update: {
      email: 'admin@jledger.com',
      password: adminPassword,
    },
    create: {
      username: 'admin',
      password: adminPassword,
      email: 'admin@jledger.com',
      firstName: 'System',
      lastName: 'Admin',
      isActive: true,
    },
  });

  // Assign SUPER_ADMIN role to default admin
  const superAdminRoleId = createdRolesMap.get('SUPER_ADMIN');
  if (superAdminRoleId) {
    await prisma.staffRole.upsert({
      where: {
        staffId_roleId: {
          staffId: adminUser.id,
          roleId: superAdminRoleId
        }
      },
      update: {},
      create: {
        staffId: adminUser.id,
        roleId: superAdminRoleId
      }
    });
  }

  console.log('✅ Comprehensive RBAC Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

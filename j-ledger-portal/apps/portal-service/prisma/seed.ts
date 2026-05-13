import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting comprehensive RBAC seed...');

  // 1. Define All Permissions
  const permissionsList = [
    // Staff & Admin Management
    {
      name: 'CREATE_ADMINS',
      resource: 'staff',
      action: 'create',
      description: 'Create new administrator accounts',
    },
    {
      name: 'DELETE_ADMINS',
      resource: 'staff',
      action: 'delete',
      description: 'Remove administrator accounts',
    },
    {
      name: 'MANAGE_STAFF',
      resource: 'staff',
      action: 'update',
      description: 'Update staff profile information',
    },
    {
      name: 'RESET_STAFF_PASSWORD',
      resource: 'staff',
      action: 'reset_password',
      description: 'Reset staff account passwords',
    },
    {
      name: 'DEACTIVATE_STAFF',
      resource: 'staff',
      action: 'deactivate',
      description: 'Deactivate staff accounts',
    },
    {
      name: 'REACTIVATE_STAFF',
      resource: 'staff',
      action: 'activate',
      description: 'Reactivate staff accounts',
    },
    {
      name: 'ASSIGN_STAFF_ROLES',
      resource: 'staff',
      action: 'assign_role',
      description: 'Assign security roles to staff',
    },

    // KYC & User Identity
    {
      name: 'VIEW_KYC',
      resource: 'kyc',
      action: 'read',
      description: 'View user KYC documents and status',
    },
    {
      name: 'APPROVE_KYC',
      resource: 'kyc',
      action: 'approve',
      description: 'Approve user KYC verification',
    },
    {
      name: 'REJECT_KYC',
      resource: 'kyc',
      action: 'reject',
      description: 'Reject user KYC verification',
    },
    {
      name: 'VIEW_USERS',
      resource: 'user',
      action: 'read',
      description: 'View customer user profiles',
    },
    {
      name: 'FREEZE_USERS',
      resource: 'user',
      action: 'freeze',
      description: 'Freeze customer accounts',
    },
    {
      name: 'UNFREEZE_USERS',
      resource: 'user',
      action: 'unfreeze',
      description: 'Unfreeze customer accounts',
    },

    // System & Security
    {
      name: 'MANAGE_SYSTEM_ROLES',
      resource: 'system',
      action: 'manage',
      description: 'Create and edit system roles',
    },
    {
      name: 'MANAGE_SYSTEM_PERMISSIONS',
      resource: 'system',
      action: 'manage',
      description: 'Manage system-wide permissions',
    },
    {
      name: 'VIEW_AUDIT_LOGS',
      resource: 'audit',
      action: 'read',
      description: 'View system administrative audit logs',
    },
    {
      name: 'VIEW_DASHBOARD',
      resource: 'dashboard',
      action: 'read',
      description: 'Access administrative dashboard',
    },
    {
      name: 'VIEW_STATISTICS',
      resource: 'stats',
      action: 'read',
      description: 'View operational statistics',
    },

    // Financial Monitoring
    {
      name: 'VIEW_TRANSACTIONS',
      resource: 'transaction',
      action: 'read',
      description: 'Monitor financial transactions',
    },
    {
      name: 'VIEW_TRANSACTION_DETAILS',
      resource: 'transaction',
      action: 'read',
      description: 'View detailed transaction data',
    },
    {
      name: 'VIEW_LEDGER_ENTRIES',
      resource: 'ledger',
      action: 'read',
      description: 'View accounting ledger entries',
    },
    {
      name: 'VIEW_ACCOUNTS',
      resource: 'account',
      action: 'read',
      description: 'View customer ledger accounts',
    },
    {
      name: 'FREEZE_ACCOUNTS',
      resource: 'account',
      action: 'freeze',
      description: 'Freeze financial accounts',
    },
    {
      name: 'UNFREEZE_ACCOUNTS',
      resource: 'account',
      action: 'unfreeze',
      description: 'Unfreeze financial accounts',
    },
    {
      name: 'VIEW_RECONCILIATION_REPORTS',
      resource: 'reconciliation',
      action: 'read',
      description: 'View reconciliation reports',
    },
    {
      name: 'RUN_RECONCILIATION',
      resource: 'reconciliation',
      action: 'execute',
      description: 'Trigger system reconciliation',
    },

    // AML
    {
      name: 'VIEW_SUSPICIOUS_ACTIVITIES',
      resource: 'AML',
      action: 'VIEW',
      description: 'View flagged suspicious activities',
    },
    {
      name: 'REVIEW_SUSPICIOUS_ACTIVITIES',
      resource: 'AML',
      action: 'REVIEW',
      description: 'Update status of suspicious activities',
    },
    {
      name: 'REPORT_TO_AMLO',
      resource: 'AML',
      action: 'REPORT',
      description: 'Send official report to AMLO',
    },

    // Merchant Management
    {
      name: 'VIEW_MERCHANTS',
      resource: 'merchant',
      action: 'read',
      description: 'View merchant partners and branches',
    },
    {
      name: 'VIEW_MERCHANT_APPLICATIONS',
      resource: 'merchant',
      action: 'read',
      description: 'View new merchant applications',
    },
    {
      name: 'APPROVE_MERCHANTS',
      resource: 'merchant',
      action: 'approve',
      description: 'Approve or reject merchant applications',
    },
    {
      name: 'MANAGE_MERCHANTS',
      resource: 'merchant',
      action: 'manage',
      description: 'Freeze, unfreeze or manage terminals',
    },
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
    {
      name: 'AUDITOR',
      description: 'View-only access to financial and audit records',
      isSystem: true,
    },
    {
      name: 'SUPPORT_AGENT',
      description: 'Limited access to user management and transactions',
      isSystem: true,
    },
    {
      name: 'COMPLIANCE_OFFICER',
      description: 'Dedicated access to KYC and AML monitoring',
      isSystem: true,
    },
  ];

  console.log('👑 Seeding roles...');
  const createdRolesMap = new Map();
  for (const role of roles) {
    const r = await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        isSystem: role.isSystem,
      },
      create: role,
    });
    createdRolesMap.set(role.name, r.id);
  }

  // 3. Link Permissions to Roles (RolePermission)
  const rolePermissionsMapping = {
    SUPER_ADMIN: permissionsList.map((p) => p.name), // Everything
    AUDITOR: [
      'VIEW_TRANSACTIONS',
      'VIEW_TRANSACTION_DETAILS',
      'VIEW_LEDGER_ENTRIES',
      'VIEW_AUDIT_LOGS',
      'VIEW_DASHBOARD',
      'VIEW_STATISTICS',
      'VIEW_MERCHANTS',
    ],
    SUPPORT_AGENT: [
      'VIEW_USERS',
      'VIEW_ACCOUNTS',
      'VIEW_TRANSACTIONS',
      'VIEW_DASHBOARD',
      'VIEW_KYC',
      'VIEW_MERCHANTS',
      'VIEW_MERCHANT_APPLICATIONS',
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
      'REJECT_KYC',
      'VIEW_MERCHANTS',
      'VIEW_MERCHANT_APPLICATIONS',
      'APPROVE_MERCHANTS',
      'MANAGE_MERCHANTS',
    ],
  };

  console.log('🔗 Linking permissions to roles...');
  for (const [roleName, perms] of Object.entries(rolePermissionsMapping)) {
    const roleId = createdRolesMap.get(roleName);
    if (!roleId) continue;

    await prisma.rolePermission.deleteMany({ where: { roleId } });

    for (const permName of perms) {
      const permissionId = createdPermissionsMap.get(permName);
      if (permissionId) {
        await prisma.rolePermission.create({
          data: {
            roleId,
            permissionId,
          },
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

  const superAdminRoleId = createdRolesMap.get('SUPER_ADMIN');
  if (superAdminRoleId) {
    await prisma.staffRole.upsert({
      where: {
        staffId_roleId: {
          staffId: adminUser.id,
          roleId: superAdminRoleId,
        },
      },
      update: {},
      create: {
        staffId: adminUser.id,
        roleId: superAdminRoleId,
      },
    });
  }

  // 5. Seed Loyalty Rules
  console.log('💎 Seeding loyalty rules...');
  const loyaltyRules = [
    {
      eventType: 'TOPUP',
      pointsPerThb: 0.04, // 25 THB = 1 Point
      minAmount: 100,
      isActive: true,
      isLocked: true,
      description: 'Earn points on successful wallet top-ups',
    },
    {
      eventType: 'P2P_TRANSFER',
      pointsPerThb: 0.04, // 25 THB = 1 Point
      minAmount: 1,
      isActive: true,
      isLocked: true,
      description: 'Earn points on peer-to-peer transfers (Sender only)',
    },
    {
      eventType: 'MERCHANT_PAYMENT',
      pointsPerThb: 0.08, // 12.5 THB = 1 Point (Bonus for spending!)
      minAmount: 1,
      isActive: true,
      isLocked: true,
      description: 'Earn points on merchant payments',
    },
  ];

  for (const rule of loyaltyRules) {
    await prisma.loyaltyRule.upsert({
      where: { eventType: rule.eventType },
      update: rule,
      create: rule,
    });
  }

  // 6. Seed Merchant Ecosystem
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    console.log('⚠️ Skipping sensitive Merchant Ecosystem seed in production environment.');
  } else {
    console.log('🏪 Seeding merchant ecosystem...');
    
    // Create a Merchant User
    const merchantUser = await prisma.user.upsert({
      where: { phoneNumber: '0812345678' },
      update: {},
      create: {
        phoneNumber: '0812345678',
        email: 'merchant@test.com',
        status: 'ACTIVE',
        registrationState: 'COMPLETED',
      },
    });

    // Create a Partner (HQ)
    const partner = await prisma.partner.upsert({
      where: { taxId: '1234567890123' },
      update: {
        userId: merchantUser.id,
        status: 'ACTIVE',
      },
      create: {
        userId: merchantUser.id,
        name: 'Coffee Master HQ',
        taxId: '1234567890123',
        status: 'ACTIVE',
        financeAccounts: {
          available: 'f0000000-0000-0000-0000-000000000001',
          pending: 'f0000000-0000-0000-0000-000000000002',
          fee: 'f0000000-0000-0000-0000-000000000003'
        },
      },
    });

    // Create a Brand for the Partner
    const brand = await prisma.brand.upsert({
      where: { name: 'Coffee Master' },
      update: { partnerId: partner.id },
      create: {
        name: 'Coffee Master',
        partnerId: partner.id,
        description: 'The best coffee in town',
        logoUrl: 'https://placehold.co/400x400?text=Coffee+Master',
      },
    });

    // Create a Merchant (Branch)
    let merchant = await prisma.merchant.findFirst({
        where: { name: 'Coffee Master - Sukhumvit Branch', partnerId: partner.id }
    });

    if (!merchant) {
        merchant = await prisma.merchant.create({
            data: {
                partnerId: partner.id,
                name: 'Coffee Master - Sukhumvit Branch',
                category: 'COFFEE_SHOP',
                address: 'Sukhumvit Soi 24, Bangkok',
                location: { lat: 13.7314, lng: 100.5694 } as any,
            },
        });
    }

    // Create a Terminal for the Branch with a random secret
    const randomSecret = 'sk_' + randomBytes(24).toString('hex');
    await prisma.terminal.upsert({
      where: { hardwareId: 'HW-TM-001' },
      update: { secretKey: randomSecret },
      create: {
        merchantId: merchant.id,
        name: 'POS-01',
        secretKey: randomSecret,
        hardwareId: 'HW-TM-001',
        status: 'ACTIVE',
      },
    });
  }

  console.log('✅ Comprehensive RBAC, Loyalty, and Merchant Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

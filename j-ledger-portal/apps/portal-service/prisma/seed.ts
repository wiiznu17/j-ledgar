import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import axios from 'axios';

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

    // 6. System Ecosystem Seed
    console.log('🏛️ Seeding system ecosystem...');
    const systemPartner = await prisma.partner.upsert({
      where: { taxId: '0000000000000' },
      update: {},
      create: {
        name: 'J-Ledger System',
        taxId: '0000000000000',
        status: 'ACTIVE',
        type: 'CORPORATE',
        feeRate: 0,
      },
    });

    const financeUrl = process.env.FINANCE_SERVICE_URL || 'http://localhost:8081';
    const internalSecret = process.env.JLEDGER_INTERNAL_SECRET || 'default_internal_secret';
    const headers = { 'X-Internal-Secret': internalSecret };

    console.log('💰 Seeding Finance Service core settings and accounts...');
    try {
      // 6.1. Seed System Settings
      await axios.put(`${financeUrl}/api/v1/system/settings`, {
        systemName: 'J-Ledger',
        companyName: 'J-Ledger Co., Ltd.',
        supportEmail: 'support@jledger.com',
        supportPhone: '+66-2-123-4567',
        defaultCurrency: 'THB',
        businessHoursStart: '09:00',
        businessHoursEnd: '17:00',
        emailNotificationsEnabled: true,
        smsNotificationsEnabled: true,
        kycRequired: true,
        twoFactorAuthRequired: false,
        defaultLanguage: 'th',
        timezone: 'Asia/Bangkok',
        sessionTimeoutMinutes: 30,
        registrationMode: 'open',
        transferFeeFixed: 5.0,
        transferFeePercentage: 0.01,
        topUpFeeFixed: 0,
        topUpFeePercentage: 0,
        billPaymentFeeFixed: 10.0,
        billPaymentFeePercentage: 0.005,
        withdrawalFeeFixed: 25.0,
        withdrawalFeePercentage: 0.02,
        minimumFee: 1.0,
        dailyTransactionLimit: 500000.0,
        monthlyTransactionLimit: 5000000.0,
        perTransactionLimit: 100000.0,
        walletBalanceLimit: 1000000.0,
        dailyTopUpLimit: 200000.0
      }, { headers });
      console.log('✅ System settings updated.');

      // 6.2. Seed SYSTEM_BANK_ACCOUNT (Double-entry core)
      try {
        await axios.post(`${financeUrl}/api/v1/accounts`, {
          user_id: '00000000-0000-0000-0000-000000000000',
          account_name: 'SYSTEM_BANK_ACCOUNT',
          currency: 'THB'
        }, { headers });
        console.log('✅ SYSTEM_BANK_ACCOUNT created.');
      } catch (e: any) {
        if (e.response?.status === 409 || e.response?.data?.message?.includes('already exists')) {
          console.log('ℹ️ SYSTEM_BANK_ACCOUNT already exists.');
        }
      }

      // 6.3. Seed Treasury Accounts
      const treasuryAccounts = [
        { name: 'SCB Operational', bankName: 'Siam Commercial Bank', accNo: '123-4-56789-0', provider: 'SCB' },
        { name: 'KBank Reserve', bankName: 'Kasikorn Bank', accNo: '098-7-65432-1', provider: 'KBANK' }
      ];

      for (const acc of treasuryAccounts) {
        // Since there's no direct Treasury API, we'll assume they are linked to the system partner
        try {
          await axios.post(`${financeUrl}/api/v1/accounts`, {
            user_id: systemPartner.id,
            account_name: acc.name,
            currency: 'THB'
          }, { headers });
          console.log(`✅ Treasury Account created: ${acc.name}`);
        } catch (e: any) {}
      }

      // 6.4. Seed Revenue and VAT Accounts
      let systemAccounts = systemPartner.financeAccounts as any || {};
      if (!systemAccounts.revenue) {
        const res = await axios.post(`${financeUrl}/api/v1/accounts`, {
          user_id: systemPartner.id,
          account_name: 'SYSTEM_REVENUE',
          currency: 'THB'
        }, { headers });
        systemAccounts.revenue = res.data.id;
      }
      if (!systemAccounts.vat_payable) {
        const res = await axios.post(`${financeUrl}/api/v1/accounts`, {
          user_id: systemPartner.id,
          account_name: 'SYSTEM_VAT_PAYABLE',
          currency: 'THB'
        }, { headers });
        systemAccounts.vat_payable = res.data.id;
      }
      await prisma.partner.update({
        where: { id: systemPartner.id },
        data: { financeAccounts: systemAccounts }
      });
      console.log('✅ System accounts linked.');

    } catch (error: any) {
      console.warn('⚠️ Warning: Failed to seed Finance Service core. Is it running?');
    }

    // 7. Seed Users, Accounts, and Wallets
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      console.log('⚠️ Skipping sensitive Ecosystem seed in production.');
    } else {
      console.log('🏪 Seeding realistic ecosystem (Customers & Merchants)...');
      
      // 7.1. Create a Sample Customer
      const customerUser = await prisma.user.upsert({
        where: { phoneNumber: '0811111111' },
        update: {},
        create: {
          phoneNumber: '0811111111',
          email: 'customer@test.com',
          status: 'ACTIVE',
          registrationState: 'COMPLETED',
        },
      });

      // Create Finance Account and Wallet for Customer
      try {
        const accRes = await axios.post(`${financeUrl}/api/v1/accounts`, {
          user_id: customerUser.id,
          account_name: 'PRIMARY_SAVINGS',
          currency: 'THB'
        }, { headers });
        
        await axios.post(`${financeUrl}/api/finance/wallets/create`, {
          userId: customerUser.id,
          currency: 'THB'
        }, { headers });

        // Initial Balance: 10,000 THB
        await axios.post(`${financeUrl}/api/finance/wallets/admin/${customerUser.id}/adjust`, {
            amount: "10000.00",
            reason: "Initial seed balance"
        }, { headers }).catch(() => {
            // If ID-based adjustment fails, try phone-based if available or skip
            console.warn('   Note: Balance adjustment might need ID-based path.');
        });

        console.log('✅ Customer User (0811111111) seeded with Account, Wallet, and Balance.');
      } catch (e: any) {
        console.warn('   Note: Customer Finance setup skipped (already exists or service down).');
      }

      // 7.2. Create a Merchant Owner User
      const merchantOwner = await prisma.user.upsert({
        where: { phoneNumber: '0812345678' },
        update: {},
        create: {
          phoneNumber: '0812345678',
          email: 'merchant@test.com',
          status: 'ACTIVE',
          registrationState: 'COMPLETED',
        },
      });

      // Create Finance Account and Wallet for Merchant Owner
      try {
        await axios.post(`${financeUrl}/api/v1/accounts`, {
          user_id: merchantOwner.id,
          account_name: 'BUSINESS_OPERATIONAL',
          currency: 'THB'
        }, { headers });
        
        await axios.post(`${financeUrl}/api/finance/wallets/create`, {
          userId: merchantOwner.id,
          currency: 'THB'
        }, { headers });

        console.log('✅ Merchant Owner User (0812345678) seeded with Account and Wallet.');
      } catch (e: any) {}

      // 7.3. Create a Partner (HQ) linked to Merchant Owner
      const partner = await prisma.partner.upsert({
        where: { taxId: '1234567890123' },
        update: {
          userId: merchantOwner.id,
          status: 'ACTIVE',
        },
        create: {
          userId: merchantOwner.id,
          name: 'Coffee Master HQ',
          taxId: '1234567890123',
          status: 'ACTIVE',
          feeRate: 0.03,
          financeAccounts: {
            available: 'f0000000-0000-0000-0000-000000000001',
            pending: 'f0000000-0000-0000-0000-000000000002',
            fee: 'f0000000-0000-0000-0000-000000000003',
            vat: 'f0000000-0000-0000-0000-000000000004'
          },
        },
      });

      // Create Brand
      const brand = await prisma.brand.upsert({
        where: { name: 'Coffee Master' },
        update: { partnerId: partner.id },
        create: {
          name: 'Coffee Master',
          partnerId: partner.id,
          description: 'The best coffee in town',
        },
      });

      // Create Merchant (Branch)
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
              },
          });
      }

      // Create Terminal
      const terminalSecret = 'sk_test_coffee_master_2024';
      await prisma.terminal.upsert({
        where: { hardwareId: 'HW-TM-001' },
        update: { secretKey: terminalSecret },
        create: {
          merchantId: merchant.id,
          name: 'POS-01',
          secretKey: terminalSecret,
          hardwareId: 'HW-TM-001',
          status: 'ACTIVE',
        },
      });
    }

  console.log('✅ Comprehensive Realistic Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

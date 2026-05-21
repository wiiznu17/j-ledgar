import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const username = process.argv[2];
  const password = process.argv[3];
  const email = process.argv[4];

  if (!username || !password || !email) {
    console.error('❌ Error: Missing arguments.');
    console.log('Usage: npm run create-admin <username> <password> <email>');
    console.log('Or inside production container:');
    console.log(
      'node dist/src/cli/create-admin.js <username> <password> <email>',
    );
    process.exit(1);
  }

  try {
    console.log(
      `🔍 Checking database for existing staff with username "${username}" or email "${email}"...`,
    );

    // Check if staff already exists with either username or email
    const existingStaff = await prisma.staff.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingStaff) {
      if (existingStaff.username === username) {
        console.error(
          `❌ Error: Staff with username "${username}" already exists.`,
        );
      } else {
        console.error(`❌ Error: Staff with email "${email}" already exists.`);
      }
      process.exit(1);
    }

    // Find or create the SUPER_ADMIN role
    console.log('🔍 Checking if SUPER_ADMIN role exists...');
    let superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });

    if (!superAdminRole) {
      console.log('ℹ️ SUPER_ADMIN role not found. Creating it...');
      superAdminRole = await prisma.role.create({
        data: {
          name: 'SUPER_ADMIN',
          description: 'Full system access (Created by CLI)',
          isSystem: true,
        },
      });
      console.log(`✅ SUPER_ADMIN role created with ID: ${superAdminRole.id}`);
    } else {
      console.log(`✅ SUPER_ADMIN role found with ID: ${superAdminRole.id}`);
    }

    // Hash the password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create staff user
    console.log(`👤 Creating staff user "${username}"...`);
    const newStaff = await prisma.staff.create({
      data: {
        username,
        password: hashedPassword,
        email,
        firstName: 'System',
        lastName: 'Admin',
        isActive: true,
      },
    });
    console.log(`✅ Staff user created with ID: ${newStaff.id}`);

    // Assign role
    console.log(`🔗 Assigning SUPER_ADMIN role to "${username}"...`);
    await prisma.staffRole.create({
      data: {
        staffId: newStaff.id,
        roleId: superAdminRole.id,
      },
    });
    console.log('🎉 Admin user setup successfully completed!');
  } catch (error) {
    console.error('❌ Unexpected error during admin creation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

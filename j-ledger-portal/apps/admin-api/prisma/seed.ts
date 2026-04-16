import { PrismaClient } from '@prisma/client-admin';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.JLEDGER_ADMIN_EMAIL || 'admin@jledger.com';
  const password = process.env.JLEDGER_ADMIN_PASSWORD || 'Admin@123';
  const passwordHash = await bcrypt.hash(password, 10);

  console.log('Seeding AdminUser...');

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Seeding completed. Use admin@jledger.com / Admin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

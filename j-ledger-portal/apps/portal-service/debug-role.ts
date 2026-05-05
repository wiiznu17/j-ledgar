import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const staff = await prisma.staff.findFirst({
    where: { email: 'admin@jledger.com' },
    include: {
      staffRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  console.log('Staff Data:', JSON.stringify(staff, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

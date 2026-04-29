import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Minimal, idempotent baseline seed.
  // Keep this safe to run multiple times (Mode 2/3 startup).

  // Example baseline permissions/roles. These names match Prisma schema models.
  // If you later expand RBAC, extend these lists rather than changing existing names.
  const permissions = [
    { name: 'admin:read', resource: 'admin', action: 'read', description: 'Read admin resources' },
    { name: 'admin:write', resource: 'admin', action: 'write', description: 'Write admin resources' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: {
        description: p.description,
        resource: p.resource,
        action: p.action,
      },
      create: p,
    });
  }

  await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: { description: 'Bootstrap super admin role' },
    create: { name: 'SUPER_ADMIN', description: 'Bootstrap super admin role' },
  });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


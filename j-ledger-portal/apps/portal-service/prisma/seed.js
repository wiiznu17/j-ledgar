const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  // Minimal, idempotent baseline seed.
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

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: { description: 'Bootstrap super admin role' },
    create: { name: 'SUPER_ADMIN', description: 'Bootstrap super admin role' },
  });

  // Create default admin user
  const adminPassword = await bcrypt.hash('password123', 10);
  const adminUser = await prisma.staff.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      email: 'admin@jledger.com',
      firstName: 'System',
      lastName: 'Admin',
      isActive: true,
    },
  });

  // Assign role to admin
  const existingRole = await prisma.staffRole.findFirst({
    where: {
      staffId: adminUser.id,
      roleId: superAdminRole.id,
    },
  });

  if (!existingRole) {
    await prisma.staffRole.create({
      data: {
        staffId: adminUser.id,
        roleId: superAdminRole.id,
      },
    });
  }

  // ==================== Loyalty & Deals Seed ====================
  
  // 1. Categories
  const categories = [
    { name: 'Food & Beverage', description: 'Delicious deals for your tummy', order: 1 },
    { name: 'Travel', description: 'Explore the world for less', order: 2 },
    { name: 'Shopping', description: 'Shop till you drop', order: 3 },
    { name: 'Entertainment', description: 'Movies, games, and more', order: 4 },
  ];

  const categoryMap = {};
  for (const cat of categories) {
    const result = await prisma.dealCategory.upsert({
      where: { name: cat.name },
      update: cat,
      create: cat,
    });
    categoryMap[cat.name] = result.id;
  }

  // 2. Brands
  const brands = [
    { name: 'Starbucks', logoUrl: 'https://logo.clearbit.com/starbucks.com', description: 'Premium Coffee' },
    { name: 'Grab', logoUrl: 'https://logo.clearbit.com/grab.com', description: 'Ride Hailing & Food' },
    { name: '7-Eleven', logoUrl: 'https://logo.clearbit.com/7-eleven.com', description: 'Convenience Store' },
  ];

  const brandMap = {};
  for (const b of brands) {
    const result = await prisma.brand.upsert({
      where: { id: b.id || undefined, name: b.name }, // Hack since name is not unique in schema, but we use it for seeding
      update: b,
      create: b,
    });
    brandMap[b.name] = result.id;
  }

  // 3. Deals
  const deals = [
    {
      title: 'Free Starbucks Upsize',
      description: 'Get a free upsize on any handcrafted beverage.',
      pointsRequired: 100,
      imageUrl: 'https://images.unsplash.com/photo-1544787210-2211d44b565a?w=800&q=80',
      brandId: brandMap['Starbucks'],
      categoryId: categoryMap['Food & Beverage'],
      stock: 1000,
      remainingStock: 1000,
      limitPerUser: 2,
      priority: 10,
      termsCondition: '1. Valid at all branches.\n2. Cannot be used with other promotions.',
    },
    {
      title: '฿50 GrabFood Discount',
      description: 'Get 50 THB off your next GrabFood order.',
      pointsRequired: 200,
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
      brandId: brandMap['Grab'],
      categoryId: categoryMap['Food & Beverage'],
      stock: 500,
      remainingStock: 500,
      limitPerUser: 1,
      priority: 5,
      termsCondition: '1. Minimum spend of 200 THB.\n2. For GrabFood only.',
    },
  ];

  for (const d of deals) {
    await prisma.deal.upsert({
      where: { id: d.id || 'MOCK_ID_' + d.title.replace(/\s/g, '_') }, // Just for seeding
      update: d,
      create: d,
    });
  }

  // 4. Banners
  const banners = [
    {
      title: 'Welcome Bonus!',
      imageUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80',
      actionPath: '/topup',
      priority: 10,
    },
    {
      title: 'Exclusive Deals for You',
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80',
      actionPath: '/(tabs)/deals',
      priority: 5,
    },
  ];

  for (const b of banners) {
    await prisma.banner.upsert({
      where: { id: b.id || 'MOCK_ID_' + b.title.replace(/\s/g, '_') },
      update: b,
      create: b,
    });
  }

  console.log('✅ Seed completed successfully!');
  console.log(`- Created ${categories.length} Categories`);
  console.log(`- Created ${brands.length} Brands`);
  console.log(`- Created ${deals.length} Deals`);
  console.log(`- Created ${banners.length} Banners`);
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


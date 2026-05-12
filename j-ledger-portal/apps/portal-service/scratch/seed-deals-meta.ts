import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Brands and Categories ---');

  // 1. Categories
  const categories = [
    { name: 'Food & Beverage', description: 'Dining, cafes, and food delivery', order: 1 },
    { name: 'Shopping', description: 'Retail, fashion, and lifestyle', order: 2 },
    { name: 'Travel', description: 'Flights, hotels, and tours', order: 3 },
    { name: 'Entertainment', description: 'Movies, games, and events', order: 4 },
    { name: 'Services', description: 'Utility, telco, and insurance', order: 5 },
  ];

  for (const cat of categories) {
    await prisma.dealCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Categories seeded');

  // 2. Brands
  const brands = [
    { name: 'Starbucks', website: 'https://www.starbucks.co.th', description: 'Coffee and snacks' },
    { name: 'Grab', website: 'https://www.grab.com', description: 'Transport and food' },
    { name: 'Major Cineplex', website: 'https://www.majorcineplex.com', description: 'Movies and entertainment' },
    { name: 'Lazada', website: 'https://www.lazada.co.th', description: 'Online shopping' },
    { name: 'AIS', website: 'https://www.ais.th', description: 'Telecommunication' },
  ];

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { name: brand.name },
      update: {},
      create: brand,
    });
  }
  console.log('✅ Brands seeded');

  console.log('--- Seeding Finished ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

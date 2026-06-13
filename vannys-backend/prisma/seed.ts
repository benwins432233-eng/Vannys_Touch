import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const hashedPassword = await bcrypt.hash('Admin@123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vannystouch.com' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'Vannys',
      email: 'admin@vannystouch.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Categories
  const categories = [
    { name: 'Robes', slug: 'robes', description: 'Collection de robes élégantes' },
    { name: 'Tops', slug: 'tops', description: 'Tops et blouses tendance' },
    { name: 'Pantalons', slug: 'pantalons', description: 'Pantalons et jeans' },
    { name: 'Accessoires', slug: 'accessoires', description: 'Sacs, bijoux et accessoires' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${categories.length} categories created`);

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

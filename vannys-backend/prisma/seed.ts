/**
 * Prisma seed script
 * Run with: npm run prisma:seed
 * Uses tsconfig.seed.json (excludes src/ rootDir restriction)
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Admin user ─────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Admin@123!', 12);
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
  console.log(`✅ Admin: ${admin.email}`);

  // ── Categories ─────────────────────────────────────────────
  const categoriesData = [
    { name: 'Robes', slug: 'robes', description: 'Collection de robes élégantes', sortOrder: 1 },
    { name: 'Tops', slug: 'tops', description: 'Tops et blouses tendance', sortOrder: 2 },
    { name: 'Pantalons', slug: 'pantalons', description: 'Pantalons et jeans', sortOrder: 3 },
    { name: 'Ensembles', slug: 'ensembles', description: 'Tenues complètes coordonnées', sortOrder: 4 },
    { name: 'Accessoires', slug: 'accessoires', description: 'Sacs, bijoux et accessoires', sortOrder: 5 },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${categoriesData.length} categories created`);

  console.log('🎉 Seed completed!');
  console.log('');
  console.log('Default credentials:');
  console.log('  Email    : admin@vannystouch.com');
  console.log('  Password : Admin@123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

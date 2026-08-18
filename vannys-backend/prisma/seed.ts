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
      // L'enum MySQL users_role vaut 'user' | 'admin' — 'ADMIN' faisait échouer le seed
      role: 'admin',
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

  // ── Réglages de boutique ───────────────────────────────────
  // Le seed doit rester rejouable sur une base déjà en service : chaque
  // réglage n'est créé que s'il manque, jamais réécrit — sinon un tarif ajusté
  // en administration serait ramené à sa valeur d'origine au prochain seed.
  const settingsData: { key: string; value: string; type: 'string' | 'number' | 'json' }[] = [
    { key: 'shipping.fee', value: '2500', type: 'number' },
    { key: 'shipping.freeThreshold', value: '50000', type: 'number' },
    {
      key: 'shipping.message',
      value: 'Livraison à domicile dans tout le Bénin sous 24 à 72 heures.',
      type: 'string',
    },
    { key: 'shop.name', value: 'Vannys Touch', type: 'string' },
    { key: 'shop.phone', value: '+229 01 41 19 66 51', type: 'string' },
    { key: 'shop.whatsapp', value: '2290141196651', type: 'string' },
    { key: 'shop.email', value: 'vannystouch.shop@gmail.com', type: 'string' },
    { key: 'shop.address', value: 'F82W+4P8, Abomey-Calavi, Bénin', type: 'string' },
    { key: 'payment.methods', value: JSON.stringify(['CASH_ON_DELIVERY']), type: 'json' },
  ];

  for (const setting of settingsData) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`✅ ${settingsData.length} réglages de boutique`);

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

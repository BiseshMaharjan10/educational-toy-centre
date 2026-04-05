import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@educationaltoycentre.com' },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@2026', 12);

    await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@educationaltoycentre.com',
        passwordHash,
        role: 'ADMIN',
        isVerified: true,
      },
    });

    console.log('✅ Admin user created');
    console.log('   Email: admin@educationaltoycentre.com');
    console.log('   Password: Admin@2026');
  } else {
    console.log('ℹ️  Admin user already exists, skipping');
  }

  console.log('✅ Seeding complete');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
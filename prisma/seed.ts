import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('Clearing old test and fake data from database...');

  // 1. Delete all deals, clients, work reports and old users
  await prisma.deal.deleteMany();
  await prisma.workReport.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating Super Admin account...');

  // 2. Create the Super Admin account requested by the user
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Osman Fatih',
      email: 'osmanfatih@bikanal.com',
      password: hashPassword('Bikanal!345'),
      role: 'ADMIN',
      target: 2500000,
      phone: '0532 000 0000',
    },
  });

  console.log(`✅ Super Admin created successfully: ${superAdmin.email} (Role: ${superAdmin.role})`);
  console.log('Database initialized cleanly without fake/test data. Ready for real-time live usage!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

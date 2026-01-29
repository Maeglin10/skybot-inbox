#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const prisma = new PrismaClient();

async function resetDemoAccount() {
  console.log('🧹 Resetting demo account data...\n');

  const demoAccount = await prisma.account.findFirst({
    where: { isDemo: true },
  });

  if (!demoAccount) {
    console.log('❌ No demo account found');
    return;
  }

  console.log(`Found demo account: ${demoAccount.id}\n`);

  // Delete all data for this account
  console.log('Deleting old data...');

  await prisma.alert.deleteMany({ where: { accountId: demoAccount.id } });
  console.log('  ✅ Deleted alerts');

  await prisma.lead.deleteMany({ where: { accountId: demoAccount.id } });
  console.log('  ✅ Deleted leads');

  await prisma.feedback.deleteMany({ where: { accountId: demoAccount.id } });
  console.log('  ✅ Deleted feedbacks');

  await prisma.routingLog.deleteMany({ where: { accountId: demoAccount.id } });
  console.log('  ✅ Deleted routing logs');

  // Delete user preferences first (foreign key)
  const users = await prisma.userAccount.findMany({
    where: { accountId: demoAccount.id },
    select: { id: true },
  });

  for (const user of users) {
    await prisma.userPreference.deleteMany({ where: { userAccountId: user.id } });
  }
  console.log('  ✅ Deleted user preferences');

  await prisma.userAccount.deleteMany({ where: { accountId: demoAccount.id } });
  console.log('  ✅ Deleted users');

  console.log('\n✨ Demo account reset complete! Run seed:demo to populate with fresh data.');

  await prisma.$disconnect();
}

resetDemoAccount().catch(console.error);

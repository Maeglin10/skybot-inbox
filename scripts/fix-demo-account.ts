#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const prisma = new PrismaClient();

async function listDemoAccounts() {
  console.log('🔍 Listing all demo-related accounts...\n');

  // Find all accounts with demo in name or isDemo flag
  const accounts = await prisma.account.findMany({
    where: {
      OR: [
        { name: { contains: 'demo', mode: 'insensitive' } },
        { isDemo: true },
      ],
    },
    include: {
      _count: {
        select: {
          alerts: true,
          leads: true,
          feedbacks: true,
          routingLogs: true,
          userAccounts: true,
        },
      },
      userAccounts: {
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          status: true,
        },
      },
    },
  });

  console.log(`Found ${accounts.length} demo account(s):\n`);

  for (const account of accounts) {
    console.log(`📦 ${account.name} (ID: ${account.id})`);
    console.log(`   isDemo: ${account.isDemo}`);
    console.log(`   Status: ${account.status}`);
    console.log(`   Created: ${account.createdAt}`);
    console.log(`   Data counts:`);
    console.log(`   - Alerts: ${account._count.alerts}`);
    console.log(`   - Leads: ${account._count.leads}`);
    console.log(`   - Feedbacks: ${account._count.feedbacks}`);
    console.log(`   - Routing Logs: ${account._count.routingLogs}`);
    console.log(`   - Users: ${account._count.userAccounts}`);

    if (account.userAccounts.length > 0) {
      console.log(`   Users:`);
      for (const user of account.userAccounts) {
        console.log(`   - ${user.email} (${user.username}) - ${user.role} - ${user.status}`);
      }
    }
    console.log('');
  }

  // Check for demo-client config
  const clientConfigs = await prisma.clientConfig.findMany({
    where: {
      OR: [
        { clientKey: { contains: 'demo', mode: 'insensitive' } },
        { name: { contains: 'demo', mode: 'insensitive' } },
      ],
    },
  });

  console.log(`\n📋 Found ${clientConfigs.length} demo client config(s):\n`);
  for (const config of clientConfigs) {
    console.log(`   - ${config.clientKey} (${config.name}) -> Account: ${config.accountId}`);
  }

  await prisma.$disconnect();
}

listDemoAccounts().catch(console.error);

#!/usr/bin/env tsx
/**
 * Create Default Account for Testing
 * This script creates a default Account in the database to allow user registration
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is missing');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Creating default accounts for testing...\n');

  try {
    // Create Nexxa main account
    const nexxaAccount = await prisma.account.upsert({
      where: { id: 'nexxa-main-account' },
      update: {},
      create: {
        id: 'nexxa-main-account',
        name: 'Nexxa',
        isDemo: false,
        features: {
          inbox: true,
          crm: true,
          analytics: true,
          agents: true,
          ai: true,
        },
      },
    });
    console.log('✅ Created/Updated Nexxa account:', nexxaAccount.id);

    // Create Demo account
    const demoAccount = await prisma.account.upsert({
      where: { id: 'demo-account' },
      update: {},
      create: {
        id: 'demo-account',
        name: 'Demo Account',
        isDemo: true,
        features: {
          inbox: true,
          crm: true,
          analytics: true,
          agents: false,
          ai: false,
        },
      },
    });
    console.log('✅ Created/Updated Demo account:', demoAccount.id);

    // Create Test account
    const testAccount = await prisma.account.upsert({
      where: { id: 'test-account' },
      update: {},
      create: {
        id: 'test-account',
        name: 'Test Account',
        isDemo: true,
        features: {
          inbox: true,
          crm: true,
          analytics: true,
          agents: true,
          ai: true,
        },
      },
    });
    console.log('✅ Created/Updated Test account:', testAccount.id);

    console.log('\n📊 Summary:');
    const allAccounts = await prisma.account.findMany({
      select: { id: true, name: true, isDemo: true },
    });
    console.table(allAccounts);

    console.log('\n✨ Done! You can now register users with these account IDs:');
    console.log('   - nexxa-main-account (Production)');
    console.log('   - demo-account (Demo)');
    console.log('   - test-account (Testing)');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

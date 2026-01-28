#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function listAll() {
  console.log('\n🔍 Listing ALL GoodLife users\n');

  try {
    const users = await prisma.userAccount.findMany({
      where: {
        OR: [
          { username: { contains: 'goodlife', mode: 'insensitive' } },
          { email: { contains: 'goodlife', mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${users.length} users:\n`);

    for (const user of users) {
      console.log('━'.repeat(60));
      console.log(`ID: ${user.id}`);
      console.log(`Username: ${user.username}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Status: ${user.status}`);
      console.log(`AccountId: ${user.accountId}`);
      console.log(`Created: ${user.createdAt.toISOString()}`);
      console.log(`Has password: ${!!user.passwordHash}`);

      if (user.passwordHash) {
        const testPassword = '4qFEZPjc8f';
        const isValid = await bcrypt.compare(testPassword, user.passwordHash);
        console.log(`Password test (4qFEZPjc8f): ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      }
    }

    console.log('━'.repeat(60));

    // Test findFirst (what auth.service uses)
    console.log('\n🎯 Testing findFirst (what auth.service.ts uses):\n');
    const foundUser = await prisma.userAccount.findFirst({
      where: { username: 'goodlife.nexxaagents' },
    });

    if (foundUser) {
      console.log(`findFirst returns: ${foundUser.id}`);
      console.log(`Username: ${foundUser.username}`);
      console.log(`Email: ${foundUser.email}`);

      if (foundUser.passwordHash) {
        const isValid = await bcrypt.compare('4qFEZPjc8f', foundUser.passwordHash);
        console.log(`Password valid: ${isValid ? '✅ YES' : '❌ NO'}`);
      }
    } else {
      console.log('❌ findFirst returns NULL');
    }

    await prisma.$disconnect();
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    await pool.end();
    throw error;
  }
}

listAll();

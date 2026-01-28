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

async function resetPassword() {
  console.log('\n🔐 Resetting GoodLife password...\n');

  try {
    const account = await prisma.account.findFirst({
      where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
    });

    if (!account) {
      console.log('❌ GoodLife account not found');
      await prisma.$disconnect();
      await pool.end();
      return;
    }

    console.log(`✅ Found account: ${account.name}`);

    const user = await prisma.userAccount.findFirst({
      where: {
        accountId: account.id,
        username: 'goodlife.nexxaagents',
      },
    });

    if (!user) {
      console.log('❌ User goodlife.nexxaagents not found');
      await prisma.$disconnect();
      await pool.end();
      return;
    }

    console.log(`✅ Found user: ${user.username} (${user.email})`);
    console.log('🔄 Updating password...');

    const newPasswordHash = await bcrypt.hash('4qFEZPjc8f', 10);

    await prisma.userAccount.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    console.log('✅ Password reset successfully!');
    console.log('\n🔑 Credentials:');
    console.log('   Username: goodlife.nexxaagents');
    console.log('   Password: 4qFEZPjc8f');
    console.log('   Email: ventas@goodlifecr.com\n');

    await prisma.$disconnect();
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    await pool.end();
    throw error;
  }
}

resetPassword();

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

async function debug() {
  console.log('\n🔍 Debugging GoodLife Authentication\n');

  try {
    const user = await prisma.userAccount.findFirst({
      where: { username: 'goodlife.nexxaagents' },
    });

    if (!user) {
      console.log('❌ User not found');
      await prisma.$disconnect();
      await pool.end();
      return;
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Has passwordHash: ${!!user.passwordHash}`);
    console.log(`   PasswordHash length: ${user.passwordHash?.length || 0}`);
    console.log(`   PasswordHash preview: ${user.passwordHash?.substring(0, 20)}...`);

    // Test password comparison
    const testPassword = '4qFEZPjc8f';
    console.log(`\n🔐 Testing password: "${testPassword}"`);

    if (!user.passwordHash) {
      console.log('❌ No password hash stored!');
      await prisma.$disconnect();
      await pool.end();
      return;
    }

    const isValid = await bcrypt.compare(testPassword, user.passwordHash);
    console.log(`   Bcrypt compare result: ${isValid ? '✅ MATCH' : '❌ NO MATCH'}`);

    // Generate a fresh hash and test it
    console.log(`\n🔄 Generating fresh hash...`);
    const freshHash = await bcrypt.hash(testPassword, 10);
    console.log(`   Fresh hash: ${freshHash.substring(0, 20)}...`);

    const freshTest = await bcrypt.compare(testPassword, freshHash);
    console.log(`   Fresh hash test: ${freshTest ? '✅ WORKS' : '❌ BROKEN'}`);

    // Update with fresh hash
    console.log(`\n💾 Updating database with fresh hash...`);
    await prisma.userAccount.update({
      where: { id: user.id },
      data: { passwordHash: freshHash },
    });
    console.log('   ✅ Updated!');

    // Verify the update
    const updated = await prisma.userAccount.findUnique({
      where: { id: user.id },
    });

    if (updated?.passwordHash) {
      const finalTest = await bcrypt.compare(testPassword, updated.passwordHash);
      console.log(`\n✅ Final verification: ${finalTest ? 'PASSWORD WORKING!' : 'STILL BROKEN'}`);
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

debug();

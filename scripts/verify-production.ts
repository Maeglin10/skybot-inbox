#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verify() {
  console.log('\n🔍 Production Verification\n');
  console.log('='.repeat(50));

  try {
    // Check GoodLife account
    const account = await prisma.account.findFirst({
      where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
    });

    if (!account) {
      console.log('❌ GoodLife account NOT FOUND');
      console.log('\n💡 Run: npx ts-node scripts/ensure-goodlife-exists.ts');
      await prisma.$disconnect();
      await pool.end();
      return;
    }

    console.log(`✅ Account: ${account.name} (ID: ${account.id})`);

    // Check user
    const user = await prisma.userAccount.findFirst({
      where: {
        accountId: account.id,
        username: 'goodlife.nexxaagents'
      },
    });

    if (!user) {
      console.log('❌ User goodlife.nexxaagents NOT FOUND');
      await prisma.$disconnect();
      await pool.end();
      return;
    }

    console.log(`✅ User: ${user.username} (${user.email})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Has password: ${user.passwordHash ? 'YES' : 'NO'}`);

    // Check conversations
    const conversations = await prisma.conversation.count({
      where: {
        inbox: {
          accountId: account.id,
        },
      },
    });

    console.log(`✅ Conversations: ${conversations}`);

    // Check messages
    const messages = await prisma.message.count({
      where: {
        conversation: {
          inbox: {
            accountId: account.id,
          },
        },
      },
    });

    console.log(`✅ Messages: ${messages}`);

    // Check contacts
    const contacts = await prisma.contact.count({
      where: { accountId: account.id },
    });

    console.log(`✅ Contacts: ${contacts}`);

    // List conversations with details
    const convDetails = await prisma.conversation.findMany({
      where: {
        inbox: {
          accountId: account.id,
        },
      },
      include: {
        contact: true,
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { lastActivityAt: 'desc' },
    });

    console.log('\n📋 Conversation Details:');
    convDetails.forEach((conv, idx) => {
      console.log(`   ${idx + 1}. ${conv.contact.name} (${conv.contact.phone})`);
      console.log(`      Status: ${conv.status}, Messages: ${conv._count.messages}`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL SYSTEMS OPERATIONAL');

    await prisma.$disconnect();
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    await pool.end();
    throw error;
  }
}

verify();

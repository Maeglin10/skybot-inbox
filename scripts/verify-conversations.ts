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
  const account = await prisma.account.findFirst({
    where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
  });

  if (!account) {
    console.log('❌ No account found');
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  console.log(`✅ Account: ${account.name} (${account.id})\n`);

  const conversations = await prisma.conversation.findMany({
    where: {
      inbox: { accountId: account.id }
    },
    include: {
      contact: true,
      _count: { select: { messages: true } }
    },
    orderBy: { lastActivityAt: 'desc' }
  });

  console.log(`📊 Total conversations: ${conversations.length}`);

  const corporate = conversations.filter(c => c.contact.isCorporate);
  console.log(`🏢 Corporate conversations: ${corporate.length}\n`);

  console.log('Conversations:');
  conversations.forEach((c, i) => {
    const corp = c.contact.isCorporate ? '🏢' : '👤';
    console.log(`${i + 1}. ${corp} ${c.contact.name} (${c.contact.phone}) - Messages: ${c._count.messages}`);
  });

  await prisma.$disconnect();
  await pool.end();
}

verify();

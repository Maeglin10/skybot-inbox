#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const prisma = new PrismaClient();

async function checkConversations() {
  const accounts = await prisma.account.findMany({
    select: { id: true, name: true },
  });

  console.log('📊 Conversations par compte:\n');

  for (const account of accounts) {
    const inboxes = await prisma.inbox.findMany({
      where: { accountId: account.id },
      select: { id: true, name: true },
    });

    if (inboxes.length === 0) {
      console.log(`${account.name}: Aucune inbox\n`);
      continue;
    }

    const inboxIds = inboxes.map(i => i.id);

    const conversations = await prisma.conversation.findMany({
      where: { inboxId: { in: inboxIds } },
      include: {
        contact: {
          select: { name: true, phone: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { text: true },
        },
      },
    });

    console.log(`${account.name}:`);
    console.log(`   Inboxes: ${inboxes.map(i => i.name).join(', ')}`);
    console.log(`   Conversations: ${conversations.length}`);

    if (conversations.length > 0) {
      conversations.forEach(conv => {
        console.log(`      • ${conv.contact.name || conv.contact.phone}`);
        if (conv.messages[0] && conv.messages[0].text) {
          const preview = conv.messages[0].text.substring(0, 50);
          console.log(`        "${preview}${conv.messages[0].text.length > 50 ? '...' : ''}"`);
        }
      });
    }
    console.log('');
  }

  await prisma.$disconnect();
}

checkConversations();

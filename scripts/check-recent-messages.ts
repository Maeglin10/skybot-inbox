#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentMessages() {
  console.log('\n📬 Checking recent WhatsApp messages...\n');

  try {
    // Get GoodLife account
    const account = await prisma.account.findFirst({
      where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
    });

    if (!account) {
      console.error('❌ GoodLife account not found!');
      return;
    }

    console.log(`✅ Account: ${account.name} (${account.id})\n`);

    // Get inbox
    const inbox = await prisma.inbox.findFirst({
      where: {
        accountId: account.id,
        channel: 'WHATSAPP',
      },
    });

    if (!inbox) {
      console.error('❌ No WhatsApp inbox found!');
      return;
    }

    console.log(`📥 Inbox: ${inbox.name} (${inbox.externalId})\n`);

    // Get recent conversations
    const conversations = await prisma.conversation.findMany({
      where: { inboxId: inbox.id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        contact: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    console.log(`💬 Recent Conversations (${conversations.length}):\n`);

    for (const conv of conversations) {
      console.log(`  ${conv.id}`);
      console.log(`    Contact: ${conv.contact?.name || 'Unknown'} (${conv.contact?.phone})`);
      console.log(`    Status: ${conv.status}`);
      console.log(`    Messages: ${conv._count.messages}`);
      console.log(`    Updated: ${conv.updatedAt.toISOString()}\n`);
    }

    // Get recent messages
    const messages = await prisma.message.findMany({
      where: {
        conversation: {
          inboxId: inbox.id,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        conversation: {
          include: { contact: true },
        },
      },
    });

    console.log(`📨 Recent Messages (${messages.length}):\n`);

    for (const msg of messages) {
      console.log(`  ${msg.id}`);
      console.log(`    From: ${msg.conversation.contact?.phone}`);
      console.log(`    Direction: ${msg.messageType}`);
      console.log(`    Content: ${msg.content?.substring(0, 100) || '(no content)'}`);
      console.log(`    Created: ${msg.createdAt.toISOString()}`);
      console.log(`    External ID: ${msg.sourceId}\n`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    throw error;
  }
}

checkRecentMessages();

#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWhatsAppConfig() {
  console.log('\n🔍 Checking WhatsApp Configuration...\n');

  try {
    // Env vars
    console.log('📋 Environment Variables:');
    console.log(`   WHATSAPP_PHONE_NUMBER_ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID}`);
    console.log(`   WHATSAPP_BUSINESS_NUMBER: ${process.env.WHATSAPP_BUSINESS_NUMBER}`);
    console.log(`   WHATSAPP_ACCESS_TOKEN: ${process.env.WHATSAPP_ACCESS_TOKEN?.substring(0, 20)}...`);
    console.log('');

    // Find GoodLife account
    const account = await prisma.account.findFirst({
      where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
    });

    if (!account) {
      console.error('❌ GoodLife account not found!');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Account: ${account.name}`);
    console.log(`   ID: ${account.id}\n`);

    // Find Inboxes
    const inboxes = await prisma.inbox.findMany({
      where: { accountId: account.id },
    });

    console.log(`📥 Inboxes (${inboxes.length}):`);
    inboxes.forEach((inbox, i) => {
      console.log(`   ${i + 1}. ${inbox.name}`);
      console.log(`      ID: ${inbox.id}`);
      console.log(`      Channel: ${inbox.channel}`);
      console.log(`      External ID: ${inbox.externalId}`);
      console.log(`      Created: ${inbox.createdAt.toISOString()}\n`);
    });

    // Find ClientConfig
    const clientConfig = await prisma.clientConfig.findFirst({
      where: { accountId: account.id },
    });

    if (clientConfig) {
      console.log(`📋 ClientConfig:`);
      console.log(`   Client Key: ${clientConfig.clientKey}`);
      console.log(`   Status: ${clientConfig.status}\n`);
    } else {
      console.log('⚠️  No ClientConfig found\n');
    }

    // Check for conversations
    const convCount = await prisma.conversation.count({
      where: { inbox: { accountId: account.id } },
    });

    console.log(`💬 Conversations: ${convCount}\n`);

    // Compare with env
    if (inboxes.length > 0) {
      const hasMatchingInbox = inboxes.some(
        inbox => inbox.externalId === process.env.WHATSAPP_PHONE_NUMBER_ID
      );

      if (hasMatchingInbox) {
        console.log('✅ Inbox externalId matches WHATSAPP_PHONE_NUMBER_ID');
      } else {
        console.log('⚠️  WARNING: No inbox matches WHATSAPP_PHONE_NUMBER_ID');
        console.log('   Expected:', process.env.WHATSAPP_PHONE_NUMBER_ID);
        console.log('   Found:', inboxes.map(i => i.externalId).join(', '));
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    throw error;
  }
}

checkWhatsAppConfig();

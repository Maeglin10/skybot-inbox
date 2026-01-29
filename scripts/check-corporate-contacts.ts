#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCorporateContacts() {
  console.log('\n🔍 Checking corporate contacts for GoodLife...\n');

  try {
    // Find GoodLife account
    const account = await prisma.account.findFirst({
      where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
    });

    if (!account) {
      console.error('❌ GoodLife account not found!');
      await prisma.$disconnect();
      return;
    }

    console.log(`✅ Account: ${account.name} (${account.id})\n`);

    // Count all contacts
    const totalContacts = await prisma.contact.count({
      where: { accountId: account.id },
    });

    // Count corporate contacts
    const corporateContacts = await prisma.contact.count({
      where: {
        accountId: account.id,
        isCorporate: true,
      },
    });

    console.log('📊 Contact Statistics:');
    console.log(`   Total contacts: ${totalContacts}`);
    console.log(`   Corporate contacts: ${corporateContacts}`);
    console.log(`   Non-corporate contacts: ${totalContacts - corporateContacts}\n`);

    // List corporate contacts
    if (corporateContacts > 0) {
      console.log('👥 Corporate Contacts:\n');
      const contacts = await prisma.contact.findMany({
        where: {
          accountId: account.id,
          isCorporate: true,
        },
        select: {
          id: true,
          name: true,
          phone: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      contacts.forEach((contact, index) => {
        console.log(`   ${index + 1}. ${contact.name}`);
        console.log(`      Phone: ${contact.phone}`);
        console.log(`      Created: ${contact.createdAt.toISOString()}\n`);
      });
    } else {
      console.log('⚠️  No corporate contacts found!\n');
      console.log('💡 Run this to create them:');
      console.log('   npx ts-node scripts/create-corporate-conversations.ts\n');
    }

    // Check conversations
    const corporateConversations = await prisma.conversation.count({
      where: {
        inbox: { accountId: account.id },
        contact: { isCorporate: true },
      },
    });

    console.log('💬 Conversations:');
    console.log(`   Corporate conversations: ${corporateConversations}\n`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    throw error;
  }
}

checkCorporateContacts();

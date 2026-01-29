#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCorporateStatus() {
  console.log('\n🔍 Checking corporate conversations status...\n');

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

    console.log(`✅ Account: ${account.name}\n`);

    // Get all corporate conversations with their status
    const conversations = await prisma.conversation.findMany({
      where: {
        inbox: { accountId: account.id },
        contact: { isCorporate: true },
      },
      include: {
        contact: {
          select: { name: true, phone: true },
        },
      },
      orderBy: { lastActivityAt: 'desc' },
    });

    console.log(`📊 Status breakdown:\n`);

    const statusCounts = conversations.reduce((acc, conv) => {
      acc[conv.status] = (acc[conv.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    console.log(`\n   Total: ${conversations.length}\n`);

    console.log(`📝 All corporate conversations:\n`);
    conversations.forEach((conv, index) => {
      console.log(`   ${index + 1}. ${conv.contact.name}`);
      console.log(`      Status: ${conv.status}`);
      console.log(`      Last activity: ${conv.lastActivityAt.toISOString()}\n`);
    });

    // Count by status for alerts
    const openCount = conversations.filter(c => c.status === 'OPEN').length;
    const pendingCount = conversations.filter(c => c.status === 'PENDING').length;
    const closedCount = conversations.filter(c => c.status === 'CLOSED').length;

    console.log(`\n💡 For Alerts API:`);
    console.log(`   OPEN conversations: ${openCount}`);
    console.log(`   PENDING conversations: ${pendingCount}`);
    console.log(`   CLOSED conversations: ${closedCount}\n`);

    if (openCount === 0) {
      console.log(`⚠️  No OPEN corporate conversations!`);
      console.log(`   To fix: Update conversations to OPEN status\n`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    throw error;
  }
}

checkCorporateStatus();

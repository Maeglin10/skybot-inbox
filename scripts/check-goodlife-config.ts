#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGoodLifeConfig() {
  console.log('\n🔍 Checking GoodLife configuration...\n');

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

    console.log(`✅ Account: ${account.name}`);
    console.log(`   ID: ${account.id}\n`);

    // Find ClientConfig for this account
    const clientConfig = await prisma.clientConfig.findFirst({
      where: { accountId: account.id },
    });

    if (!clientConfig) {
      console.error('❌ No ClientConfig found for GoodLife!');
      console.log('\n💡 This might be why the alerts are not showing.');
      console.log('   The frontend uses clientKey to fetch alerts.\n');
      await prisma.$disconnect();
      return;
    }

    console.log(`📋 ClientConfig:`);
    console.log(`   Client Key: ${clientConfig.clientKey}`);
    console.log(`   Name: ${clientConfig.name || 'N/A'}`);
    console.log(`   Status: ${clientConfig.status}\n`);

    // Check if there are corporate conversations
    const corporateConvCount = await prisma.conversation.count({
      where: {
        inbox: { accountId: account.id },
        contact: { isCorporate: true },
      },
    });

    console.log(`💬 Corporate conversations: ${corporateConvCount}\n`);

    // Find user account for GoodLife
    const user = await prisma.userAccount.findFirst({
      where: { accountId: account.id },
      select: { email: true, username: true },
    });

    if (user) {
      console.log(`👤 User login:`);
      console.log(`   Username: ${user.username || user.email}`);
      console.log(`   Password: 4qFEZPjc8f\n`);
    }

    console.log(`📝 To test the API manually:`);
    console.log(`   curl -H "x-client-key: ${clientConfig.clientKey}" \\`);
    console.log(`        https://skybot-inbox.onrender.com/api/alerts?type=CORPORATE\\&status=OPEN\n`);

    console.log(`📱 Frontend localStorage should have:`);
    console.log(`   clientKey: "${clientConfig.clientKey}"\n`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    throw error;
  }
}

checkGoodLifeConfig();

#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkExternalAccount() {
  console.log('\n🔍 Checking ExternalAccount configuration...\n');

  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '966520989876579';

    console.log(`Looking for ExternalAccount with externalId: ${phoneNumberId}\n`);

    // Find ExternalAccount
    const externalAccount = await prisma.externalAccount.findFirst({
      where: {
        channel: 'WHATSAPP',
        externalId: phoneNumberId,
      },
    });

    if (externalAccount) {
      console.log('✅ ExternalAccount found:');
      console.log(`   ID: ${externalAccount.id}`);
      console.log(`   Account ID: ${externalAccount.accountId}`);
      console.log(`   Client Key: ${externalAccount.clientKey}`);
      console.log(`   External ID: ${externalAccount.externalId}`);
      console.log(`   Channel: ${externalAccount.channel}`);
      console.log(`   Name: ${externalAccount.name}\n`);
    } else {
      console.log('❌ No ExternalAccount found!');
      console.log('\n💡 Creating ExternalAccount for GoodLife...\n');

      // Get GoodLife account
      const account = await prisma.account.findFirst({
        where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
      });

      if (!account) {
        console.error('❌ GoodLife account not found!');
        await prisma.$disconnect();
        return;
      }

      // Get ClientConfig
      const clientConfig = await prisma.clientConfig.findFirst({
        where: { accountId: account.id },
      });

      if (!clientConfig) {
        console.error('❌ No ClientConfig found for GoodLife!');
        await prisma.$disconnect();
        return;
      }

      // Create ExternalAccount
      const newExtAccount = await prisma.externalAccount.create({
        data: {
          accountId: account.id,
          channel: 'WHATSAPP',
          externalId: phoneNumberId,
          clientKey: clientConfig.clientKey,
          name: 'GoodLife WhatsApp',
        },
      });

      console.log('✅ ExternalAccount created!');
      console.log(`   ID: ${newExtAccount.id}`);
      console.log(`   Account ID: ${newExtAccount.accountId}`);
      console.log(`   Client Key: ${newExtAccount.clientKey}`);
      console.log(`   External ID: ${newExtAccount.externalId}\n`);
    }

    // Also check Inbox
    const inbox = await prisma.inbox.findFirst({
      where: {
        externalId: phoneNumberId,
        channel: 'WHATSAPP',
      },
    });

    if (inbox) {
      console.log('✅ Inbox found:');
      console.log(`   ID: ${inbox.id}`);
      console.log(`   Account ID: ${inbox.accountId}`);
      console.log(`   External ID: ${inbox.externalId}\n`);
    } else {
      console.log('⚠️  No Inbox found with this externalId\n');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    throw error;
  }
}

checkExternalAccount();

#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateGoodLifePhone() {
  console.log('\n🔄 Updating GoodLife WhatsApp Phone Number...\n');

  const newPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const newBusinessNumber = process.env.WHATSAPP_BUSINESS_NUMBER;

  if (!newPhoneNumberId) {
    console.error('❌ WHATSAPP_PHONE_NUMBER_ID not found in .env');
    process.exit(1);
  }

  console.log(`📱 New Phone Number ID: ${newPhoneNumberId}`);
  console.log(`📞 Business Number: ${newBusinessNumber}\n`);

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

    console.log(`✅ Found account: ${account.name} (${account.id})\n`);

    // Find existing inbox
    const inbox = await prisma.inbox.findFirst({
      where: {
        accountId: account.id,
        channel: 'WHATSAPP',
      },
    });

    if (!inbox) {
      console.error('❌ No WhatsApp inbox found for GoodLife!');
      console.log('\n💡 Creating new inbox...\n');

      const newInbox = await prisma.inbox.create({
        data: {
          accountId: account.id,
          name: 'WhatsApp GoodLife',
          channel: 'WHATSAPP',
          externalId: newPhoneNumberId,
        },
      });

      console.log('✅ Inbox created!');
      console.log(`   ID: ${newInbox.id}`);
      console.log(`   External ID: ${newInbox.externalId}\n`);
    } else {
      console.log(`📥 Current Inbox:`);
      console.log(`   ID: ${inbox.id}`);
      console.log(`   Name: ${inbox.name}`);
      console.log(`   Old External ID: ${inbox.externalId}`);
      console.log(`   New External ID: ${newPhoneNumberId}\n`);

      if (inbox.externalId === newPhoneNumberId) {
        console.log('✅ Phone number ID already up to date!');
      } else {
        // Update inbox
        const updated = await prisma.inbox.update({
          where: { id: inbox.id },
          data: { externalId: newPhoneNumberId },
        });

        console.log('✅ Inbox updated!');
        console.log(`   New External ID: ${updated.externalId}\n`);

        // Count conversations
        const convCount = await prisma.conversation.count({
          where: { inboxId: inbox.id },
        });

        console.log(`📊 ${convCount} conversations linked to this inbox`);
      }
    }

    console.log('\n🎉 Update complete!\n');
    console.log('📋 Next steps:');
    console.log('   1. Configure webhook on Meta:');
    console.log('      URL: https://skybot-inbox.onrender.com/api/webhooks/whatsapp');
    console.log(`      Verify Token: ${process.env.WHATSAPP_VERIFY_TOKEN || '<from .env>'}`);
    console.log('   2. Test by sending a WhatsApp message');
    console.log('   3. Check logs on Render\n');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    throw error;
  }
}

updateGoodLifePhone();

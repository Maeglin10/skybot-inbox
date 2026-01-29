#!/usr/bin/env node
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL missing');
  process.exit(1);
}

const prisma = new PrismaClient();

async function ensureGoodLifeExists() {
  console.log('🔍 [ENSURE-GOODLIFE] Starting verification...');

  try {
    // Vérifier si GoodLife existe
    let account = await prisma.account.findFirst({
      where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
    });

    if (account) {
      console.log('✅ [ENSURE-GOODLIFE] Account exists - checking user...');

      // Vérifier si l'utilisateur existe
      const user = await prisma.userAccount.findFirst({
        where: {
          accountId: account.id,
          username: 'goodlife.nexxaagents',
        },
      });

      if (user && user.passwordHash) {
        console.log('✅ [ENSURE-GOODLIFE] User exists with password - OK');
        await prisma.$disconnect();
        return;
      }

      if (user && !user.passwordHash) {
        console.log('⚠️  [ENSURE-GOODLIFE] User exists but no password - updating...');
        const passwordHash = await bcrypt.hash('4qFEZPjc8f', 10);
        await prisma.userAccount.update({
          where: { id: user.id },
          data: { passwordHash },
        });
        console.log('✅ [ENSURE-GOODLIFE] Password added successfully');
        await prisma.$disconnect();
        return;
      }

      if (!user) {
        console.log('⚠️  [ENSURE-GOODLIFE] User missing - creating...');
        const passwordHash = await bcrypt.hash('4qFEZPjc8f', 10);
        const newUser = await prisma.userAccount.create({
          data: {
            accountId: account.id,
            username: 'goodlife.nexxaagents',
            email: 'ventas@goodlifecr.com',
            passwordHash,
            name: 'GoodLife Agent',
            role: 'USER',
            status: 'ACTIVE',
          },
        });

        // Ensure preferences exist
        const existingPrefs = await prisma.userPreference.findUnique({
          where: { userAccountId: newUser.id },
        });

        if (!existingPrefs) {
          await prisma.userPreference.create({
            data: {
              userAccountId: newUser.id,
              theme: 'DEFAULT',
              language: 'ES',
              timezone: 'UTC',
            },
          });
        }

        console.log('✅ [ENSURE-GOODLIFE] User created successfully');
        console.log('   Username: goodlife.nexxaagents');
        console.log('   Password: 4qFEZPjc8f');
        await prisma.$disconnect();
        return;
      }
    }

    // GoodLife n'existe pas - le recréer automatiquement
    console.log('⚠️  [ENSURE-GOODLIFE] Account missing - recreating...');

    account = await prisma.account.create({
      data: {
        name: 'Goodlife Costa Rica',
        status: 'ACTIVE',
        isDemo: false, // PRODUCTION account - NEVER delete
      },
    });

    const passwordHash = await bcrypt.hash('4qFEZPjc8f', 10);
    const user = await prisma.userAccount.create({
      data: {
        accountId: account.id,
        username: 'goodlife.nexxaagents',
        email: 'ventas@goodlifecr.com',
        passwordHash,
        name: 'GoodLife Agent',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    await prisma.userPreference.create({
      data: {
        userAccountId: user.id,
        theme: 'DEFAULT',
        language: 'ES',
        timezone: 'UTC',
      },
    });

    const inbox = await prisma.inbox.create({
      data: {
        accountId: account.id,
        externalId: '966520989876579',
        name: 'WhatsApp GoodLife',
        channel: 'WHATSAPP',
      },
    });

    await prisma.clientConfig.create({
      data: {
        clientKey: 'goodlife',
        name: 'GoodLife Costa Rica',
        accountId: account.id,
        channels: ['WHATSAPP'],
        allowedAgents: ['master-router'],
        externalAccounts: [],
        status: 'ACTIVE',
      },
    });

    await prisma.externalAccount.create({
      data: {
        accountId: account.id,
        channel: 'WHATSAPP',
        externalId: '966520989876579',
        clientKey: 'goodlife',
        name: 'GoodLife WhatsApp',
        isActive: true,
      },
    });

    // Create 5 corporate contacts with conversations
    const corporateContacts = [
      { name: 'Carlos Rodríguez - Director General', phone: '+50688881111' },
      { name: 'Ana García - Operaciones', phone: '+50688882222' },
      { name: 'María López - Servicio al Cliente', phone: '+50688883333' },
      { name: 'José Hernández - Gerente', phone: '+50688884444' },
      { name: 'Laura Martínez - Recursos Humanos', phone: '+50688885555' },
    ];

    for (const contactData of corporateContacts) {
      const contact = await prisma.contact.create({
        data: {
          accountId: account.id,
          inboxId: inbox.id,
          phone: contactData.phone,
          name: contactData.name,
          isCorporate: true,
        },
      });

      const conversation = await prisma.conversation.create({
        data: {
          accountId: account.id,
          inboxId: inbox.id,
          contactId: contact.id,
          status: 'OPEN',
        },
      });

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          inboxId: inbox.id,
          messageType: 'INCOMING',
          from: contactData.phone,
          to: '+50660213707',
          text: `Mensaje corporativo de ${contactData.name}`,
          timestamp: new Date(),
        },
      });
    }

    // Create test contact
    const testContact = await prisma.contact.create({
      data: {
        accountId: account.id,
        inboxId: inbox.id,
        phone: '+50612345678',
        name: 'Cliente Test',
      },
    });

    const testConv = await prisma.conversation.create({
      data: {
        accountId: account.id,
        inboxId: inbox.id,
        contactId: testContact.id,
        status: 'OPEN',
      },
    });

    await prisma.message.create({
      data: {
        conversationId: testConv.id,
        inboxId: inbox.id,
        messageType: 'INCOMING',
        from: '+50612345678',
        to: '+50660213707',
        text: '🧪 Mensaje de prueba - SkyBot Inbox funcionando correctamente! ✅',
        timestamp: new Date(),
      },
    });

    console.log('✅ [ENSURE-GOODLIFE] Account recreated successfully');
    console.log('   Account ID:', account.id);
    console.log('   Username: goodlife.nexxaagents');
    console.log('   Password: 4qFEZPjc8f');
    console.log('   Conversations: 6 (5 corporate + 1 test)');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ [ENSURE-GOODLIFE] Error:', error);
    await prisma.$disconnect();
    throw error;
  }
}

ensureGoodLifeExists().catch((error) => {
  console.error('❌ [ENSURE-GOODLIFE] Fatal error:', error);
  process.exit(1);
});

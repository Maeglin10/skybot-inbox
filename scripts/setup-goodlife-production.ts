#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const prisma = new PrismaClient();

async function setupGoodLifeProduction() {
  console.log('🚀 Setup complet GoodLife - Production\n');

  // 1. Créer ou récupérer le compte GoodLife
  console.log('📊 1. Création du compte...');
  let account = await prisma.account.findFirst({
    where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
  });

  if (!account) {
    account = await prisma.account.create({
      data: {
        name: 'Goodlife Costa Rica',
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Compte créé: ${account.name}\n`);
  } else {
    console.log(`✅ Compte existant: ${account.name}\n`);
  }

  // 2. Créer l'utilisateur
  console.log('👤 2. Création de l\'utilisateur...');
  const password = '4qFEZPjc8f';
  const passwordHash = await bcrypt.hash(password, 10);

  let user = await prisma.userAccount.findFirst({
    where: { username: 'goodlife.nexxaagents' },
  });

  if (!user) {
    user = await prisma.userAccount.create({
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

    // Créer les préférences
    await prisma.userPreference.create({
      data: {
        userAccountId: user.id,
        theme: 'DEFAULT',
        language: 'ES',
        timezone: 'UTC',
      },
    });

    console.log(`✅ Utilisateur créé: ${user.username}\n`);
  } else {
    // Mettre à jour si existe
    user = await prisma.userAccount.update({
      where: { id: user.id },
      data: {
        passwordHash,
        email: 'ventas@goodlifecr.com',
        status: 'ACTIVE',
        accountId: account.id,
      },
    });
    console.log(`✅ Utilisateur mis à jour: ${user.username}\n`);
  }

  // 3. Créer l'inbox WhatsApp
  console.log('📬 3. Création de l\'inbox WhatsApp...');
  let inbox = await prisma.inbox.findFirst({
    where: {
      accountId: account.id,
      channel: 'WHATSAPP',
    },
  });

  if (!inbox) {
    inbox = await prisma.inbox.create({
      data: {
        accountId: account.id,
        externalId: '60925012724039335',
        name: 'WhatsApp GoodLife',
        channel: 'WHATSAPP',
      },
    });
    console.log(`✅ Inbox créée: ${inbox.name}\n`);
  } else {
    console.log(`✅ Inbox existante: ${inbox.name}\n`);
  }

  // 4. Créer le ClientConfig
  console.log('⚙️  4. Configuration du routing...');
  let clientConfig = await prisma.clientConfig.findFirst({
    where: { clientKey: 'goodlife' },
  });

  if (!clientConfig) {
    clientConfig = await prisma.clientConfig.create({
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
    console.log('✅ ClientConfig créé\n');
  } else {
    console.log('✅ ClientConfig existant\n');
  }

  // 5. Créer l'ExternalAccount pour le routing
  const phoneNumberId = '60925012724039335';
  let externalAccount = await prisma.externalAccount.findFirst({
    where: {
      accountId: account.id,
      externalId: phoneNumberId,
    },
  });

  if (!externalAccount) {
    externalAccount = await prisma.externalAccount.create({
      data: {
        accountId: account.id,
        channel: 'WHATSAPP',
        externalId: phoneNumberId,
        clientKey: 'goodlife',
        name: 'GoodLife WhatsApp',
        isActive: true,
      },
    });
    console.log('✅ ExternalAccount créé pour routing\n');
  } else {
    console.log('✅ ExternalAccount existant\n');
  }

  // 6. Créer les contacts corporatifs
  console.log('👥 5. Création des contacts corporatifs...');
  const corporateContacts = [
    { name: 'Ana García - Ventas', phone: '+50688881111' },
    { name: 'Carlos Rodríguez - Administración', phone: '+50688882222' },
    { name: 'María López - Servicio al Cliente', phone: '+50688883333' },
    { name: 'José Hernández - Gerente', phone: '+50688884444' },
    { name: 'Laura Martínez - Recursos Humanos', phone: '+50688885555' },
  ];

  for (const contactData of corporateContacts) {
    let contact = await prisma.contact.findFirst({
      where: {
        accountId: account.id,
        phone: contactData.phone,
      },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          accountId: account.id,
          inboxId: inbox.id,
          phone: contactData.phone,
          name: contactData.name,
          isCorporate: true,
        },
      });

      // Créer conversation
      const conversation = await prisma.conversation.create({
        data: {
          inboxId: inbox.id,
          contactId: contact.id,
          channel: 'WHATSAPP',
          externalId: `corporate-${contact.phone}-${Date.now()}`,
          status: 'OPEN',
          lastActivityAt: new Date(),
        },
      });

      // Message initial
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          channel: 'WHATSAPP',
          externalId: `msg-${Date.now()}-${contact.phone}`,
          direction: 'IN',
          from: contact.phone,
          to: '+50660213707',
          text: `Hola! Soy ${contactData.name.split(' - ')[0]} del equipo GoodLife.`,
          timestamp: new Date(),
        },
      });

      console.log(`   ✅ ${contact.name}`);
    }
  }

  // 7. Créer un contact de test
  console.log('\n🧪 6. Création du contact de test...');
  const testPhone = '+50612345678';
  let testContact = await prisma.contact.findFirst({
    where: {
      accountId: account.id,
      phone: testPhone,
    },
  });

  if (!testContact) {
    testContact = await prisma.contact.create({
      data: {
        accountId: account.id,
        inboxId: inbox.id,
        phone: testPhone,
        name: 'Cliente Test',
      },
    });

    const conversation = await prisma.conversation.create({
      data: {
        inboxId: inbox.id,
        contactId: testContact.id,
        channel: 'WHATSAPP',
        externalId: `test-conv-${Date.now()}`,
        status: 'OPEN',
        lastActivityAt: new Date(),
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        channel: 'WHATSAPP',
        externalId: `test-msg-${Date.now()}`,
        direction: 'IN',
        from: testPhone,
        to: '+50660213707',
        text: '🧪 Mensaje de prueba - SkyBot Inbox funcionando correctamente! ✅',
        timestamp: new Date(),
      },
    });

    console.log('   ✅ Contact de test créé\n');
  }

  // Résumé final
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎉 SETUP TERMINÉ AVEC SUCCÈS !');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📋 Identifiants de connexion:');
  console.log('   URL:      https://skybot-inbox-ui.onrender.com');
  console.log('   Username: goodlife.nexxaagents');
  console.log('   Password: 4qFEZPjc8f');
  console.log('   Email:    ventas@goodlifecr.com\n');
  console.log('📊 Ressources créées:');
  console.log(`   ✅ Account ID:         ${account.id}`);
  console.log(`   ✅ User ID:            ${user.id}`);
  console.log(`   ✅ Inbox ID:           ${inbox.id}`);
  console.log(`   ✅ Phone Number ID:    ${phoneNumberId}`);
  console.log(`   ✅ Contacts:           ${corporateContacts.length + 1}`);
  console.log('\n═══════════════════════════════════════════════════════\n');

  await prisma.$disconnect();
}

setupGoodLifeProduction().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

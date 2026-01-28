#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createTestMessage() {
  console.log('🧪 Création d\'un message de test pour GoodLife...\n');

  // 1. Trouver le compte GoodLife
  const goodLifeAccount = await prisma.account.findFirst({
    where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
  });

  if (!goodLifeAccount) {
    console.log('❌ Compte GoodLife non trouvé !');
    process.exit(1);
  }

  console.log(`✅ Compte: ${goodLifeAccount.name}\n`);

  // 2. Créer ou récupérer une Inbox
  let inbox = await prisma.inbox.findFirst({
    where: {
      accountId: goodLifeAccount.id,
      channel: 'WHATSAPP',
    },
  });

  if (!inbox) {
    inbox = await prisma.inbox.create({
      data: {
        accountId: goodLifeAccount.id,
        externalId: '60925012724039335',
        name: 'WhatsApp GoodLife',
        channel: 'WHATSAPP',
      },
    });
    console.log('✅ Inbox créée\n');
  } else {
    console.log(`✅ Inbox existante: ${inbox.name}\n`);
  }

  // 3. Créer un contact de test
  const testPhone = '+50612345678';
  let contact = await prisma.contact.findFirst({
    where: {
      accountId: goodLifeAccount.id,
      phone: testPhone,
    },
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        accountId: goodLifeAccount.id,
        inboxId: inbox.id,
        phone: testPhone,
        name: 'Cliente Test',
      },
    });
    console.log(`✅ Contact créé: ${contact.name} (${contact.phone})\n`);
  } else {
    console.log(`✅ Contact existant: ${contact.name}\n`);
  }

  // 4. Créer une conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      inboxId: inbox.id,
      contactId: contact.id,
      status: 'OPEN',
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        inboxId: inbox.id,
        contactId: contact.id,
        channel: 'WHATSAPP',
        externalId: `test-conv-${Date.now()}`,
        status: 'OPEN',
        lastActivityAt: new Date(),
      },
    });
    console.log('✅ Conversation créée\n');
  } else {
    console.log('✅ Conversation existante\n');
  }

  // 5. Créer un message de test
  const message = await prisma.message.create({
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

  console.log('✅ Message de test créé !\n');
  console.log('📋 Détails:');
  console.log(`   De: ${message.from}`);
  console.log(`   Vers: ${message.to}`);
  console.log(`   Texte: ${message.text}\n`);

  // 6. Vérifier le message
  const verification = await prisma.message.findUnique({
    where: { id: message.id },
    include: {
      conversation: {
        include: {
          contact: true,
          inbox: {
            include: {
              account: true,
            },
          },
        },
      },
    },
  });

  if (verification) {
    console.log('✅ Vérification du routing:');
    console.log(`   Message ID: ${verification.id}`);
    console.log(`   Conversation ID: ${verification.conversation.id}`);
    console.log(`   Contact: ${verification.conversation.contact.name}`);
    console.log(`   Inbox: ${verification.conversation.inbox.name}`);
    console.log(`   Account: ${verification.conversation.inbox.account.name}\n`);
  }

  console.log('🎉 Message de test créé avec succès !\n');
  console.log('📱 Maintenant:');
  console.log('   1. Va sur https://skybot-inbox-ui.onrender.com');
  console.log('   2. Connecte-toi avec: goodlife.nexxaagents / 4qFEZPjc8f');
  console.log('   3. Tu devrais voir le message dans l\'inbox !\n');

  await prisma.$disconnect();
  await pool.end();
}

createTestMessage().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

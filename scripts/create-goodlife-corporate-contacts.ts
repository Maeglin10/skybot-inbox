#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const prisma = new PrismaClient();

// Lista de contactos corporativos de GoodLife
const corporateContacts = [
  { name: 'Ana García - Ventas', phone: '+50688881111' },
  { name: 'Carlos Rodríguez - Administración', phone: '+50688882222' },
  { name: 'María López - Servicio al Cliente', phone: '+50688883333' },
  { name: 'José Hernández - Gerente', phone: '+50688884444' },
  { name: 'Laura Martínez - Recursos Humanos', phone: '+50688885555' },
];

async function createCorporateContacts() {
  console.log('🏢 Creación de contactos corporativos GoodLife...\n');

  // 1. Trouver le compte GoodLife
  const goodLifeAccount = await prisma.account.findFirst({
    where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
  });

  if (!goodLifeAccount) {
    console.log('❌ Compte GoodLife non trouvé !');
    process.exit(1);
  }

  console.log(`✅ Compte: ${goodLifeAccount.name}\n`);

  // 2. Trouver ou créer l'inbox
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
    console.log(`✅ Inbox: ${inbox.name}\n`);
  }

  // 3. Créer les contacts et conversations corporatifs
  console.log('👥 Création des contacts corporatifs:\n');

  for (const contactData of corporateContacts) {
    // Vérifier si le contact existe déjà
    let contact = await prisma.contact.findFirst({
      where: {
        accountId: goodLifeAccount.id,
        phone: contactData.phone,
      },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          accountId: goodLifeAccount.id,
          inboxId: inbox.id,
          phone: contactData.phone,
          name: contactData.name,
          isCorporate: true, // ⭐ Marqué comme corporate
        },
      });
      console.log(`   ✅ Contact créé: ${contact.name}`);
    } else {
      // Mettre à jour pour s'assurer qu'il est marqué corporate
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: { isCorporate: true, name: contactData.name },
      });
      console.log(`   ✅ Contact existant mis à jour: ${contact.name}`);
    }

    // Créer une conversation pour ce contact
    let conversation = await prisma.conversation.findFirst({
      where: {
        inboxId: inbox.id,
        contactId: contact.id,
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          inboxId: inbox.id,
          contactId: contact.id,
          channel: 'WHATSAPP',
          externalId: `corporate-${contact.phone}-${Date.now()}`,
          status: 'OPEN',
          lastActivityAt: new Date(),
        },
      });
      console.log(`      → Conversation créée\n`);
    } else {
      console.log(`      → Conversation existante\n`);
    }

    // Créer un message initial (optionnel)
    const messageCount = await prisma.message.count({
      where: { conversationId: conversation.id },
    });

    if (messageCount === 0) {
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
      console.log(`      → Message initial créé\n`);
    }
  }

  // 4. Résumé
  const corporateCount = await prisma.contact.count({
    where: {
      accountId: goodLifeAccount.id,
      isCorporate: true,
    },
  });

  const conversationsCount = await prisma.conversation.count({
    where: {
      inbox: { accountId: goodLifeAccount.id },
      contact: { isCorporate: true },
    },
  });

  console.log('📊 Résumé:\n');
  console.log(`   ✅ Contacts corporatifs: ${corporateCount}`);
  console.log(`   ✅ Conversations corporatives: ${conversationsCount}\n`);

  console.log('🎉 Contacts corporatifs créés avec succès !\n');
  console.log('📱 Ces conversations apparaîtront dans:');
  console.log('   Alerts > Filter: Corporativo\n');

  await prisma.$disconnect();
}

createCorporateContacts().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

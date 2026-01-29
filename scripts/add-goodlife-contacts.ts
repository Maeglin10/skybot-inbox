#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function addGoodLifeContacts() {
  console.log('🏢 Ajout de contacts GoodLife\n');
  console.log('Format: Nom complet, Numéro (avec +506)\n');
  console.log('Exemple: Juan Pérez, +50688889999\n');
  console.log('Tapez "done" quand vous avez fini\n');

  const goodLifeAccount = await prisma.account.findFirst({
    where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
  });

  if (!goodLifeAccount) {
    console.log('❌ Compte GoodLife non trouvé !');
    process.exit(1);
  }

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
  }

  const contacts: Array<{ name: string; phone: string }> = [];
  let counter = 1;

  while (true) {
    const input = await askQuestion(`Contact ${counter} (nom, numéro) ou "done": `);

    if (input.trim().toLowerCase() === 'done') {
      break;
    }

    const parts = input.split(',').map(s => s.trim());
    if (parts.length !== 2) {
      console.log('⚠️  Format invalide. Utilisez: Nom, +506XXXXXXXX\n');
      continue;
    }

    const [name, phone] = parts;
    if (!phone.startsWith('+506')) {
      console.log('⚠️  Le numéro doit commencer par +506\n');
      continue;
    }

    contacts.push({ name, phone });
    counter++;
  }

  rl.close();

  if (contacts.length === 0) {
    console.log('\n⚠️  Aucun contact à ajouter.\n');
    process.exit(0);
  }

  console.log(`\n📝 ${contacts.length} contact(s) à créer\n`);

  const isCorporate = (await askQuestion('Ces contacts sont-ils corporatifs? (y/n): ')).toLowerCase() === 'y';

  for (const contactData of contacts) {
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
          isCorporate,
        },
      });
      console.log(`   ✅ ${contact.name} créé`);
    } else {
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: { name: contactData.name, isCorporate },
      });
      console.log(`   ✅ ${contact.name} mis à jour`);
    }

    // Créer conversation
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
          externalId: `contact-${contact.phone}-${Date.now()}`,
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
          text: `Hola, soy ${contactData.name.split(' ')[0]}!`,
          timestamp: new Date(),
        },
      });

      console.log(`      → Conversation créée\n`);
    }
  }

  console.log('\n🎉 Terminé !\n');

  await prisma.$disconnect();
}

addGoodLifeContacts().catch((error) => {
  console.error('❌ Erreur:', error);
  rl.close();
  process.exit(1);
});

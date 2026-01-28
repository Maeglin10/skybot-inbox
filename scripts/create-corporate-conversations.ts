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

const corporateContacts = [
  { name: 'Pamela Chavarria', phone: '+50688284915', role: 'Team' },
  { name: 'Marcello Allegra', phone: '+50687057802', role: 'Management' },
  { name: 'Marcela Robles', phone: '+50683878226', role: 'Team' },
  { name: 'Team Administración', phone: '+50683419449', role: 'Administration' },
  { name: 'Bodega', phone: '+50663472858', role: 'Bodega' },
  { name: 'Goodlife Sabana', phone: '+50689784900', role: 'Team' },
  { name: 'Goodlife Lindora', phone: '+50689784910', role: 'Team' },
  { name: 'Michael Streda', phone: '+50671315444', role: 'Management' },
  { name: 'Erick Marchena', phone: '+50686815653', role: 'Team' },
  { name: 'Yeudy Araya Herrera', phone: '+50685323054', role: 'Team' },
  { name: 'Brandon Cookhorn Etiplast', phone: '+50661386837', role: 'Team' },
];

const messages = [
  'Hola, buenos días! 👋',
  'Necesito acceso al sistema por favor',
  'Reportándome desde mi ubicación 📱',
  'Buenos días equipo! Listo para trabajar ✅',
  'Tengo una consulta sobre el inventario',
  'Todo en orden por aquí! 👍',
  'Necesito ayuda con un cliente',
  'Actualizando el status del día',
  'Checando disponibilidad de productos',
  'Coordinando con el equipo',
  'Revisando los pendientes de hoy',
];

async function createCorporateConversations() {
  console.log('\n🏢 Creating corporate conversations for GoodLife...\n');

  try {
    // Find GoodLife account
    const account = await prisma.account.findFirst({
      where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
    });

    if (!account) {
      console.error('❌ GoodLife account not found!');
      await prisma.$disconnect();
      await pool.end();
      return;
    }

    console.log(`✅ Found account: ${account.name} (${account.id})`);

    // Find GoodLife inbox
    const inbox = await prisma.inbox.findFirst({
      where: {
        accountId: account.id,
        channel: 'WHATSAPP',
      },
    });

    if (!inbox) {
      console.error('❌ GoodLife inbox not found!');
      await prisma.$disconnect();
      await pool.end();
      return;
    }

    console.log(`✅ Found inbox: ${inbox.name} (${inbox.id})\n`);
    console.log('='.repeat(60));

    let created = 0;
    let skipped = 0;

    for (const contactData of corporateContacts) {
      // Check if contact already exists
      const existingContact = await prisma.contact.findFirst({
        where: {
          accountId: account.id,
          phone: contactData.phone,
        },
      });

      if (existingContact) {
        console.log(`⏭️  ${contactData.name} (${contactData.phone}) - Already exists`);
        skipped++;
        continue;
      }

      // Create contact
      const contact = await prisma.contact.create({
        data: {
          accountId: account.id,
          inboxId: inbox.id,
          phone: contactData.phone,
          name: contactData.name,
          isCorporate: true, // Mark as corporate!
        },
      });

      // Create conversation
      const conversation = await prisma.conversation.create({
        data: {
          inboxId: inbox.id,
          contactId: contact.id,
          channel: 'WHATSAPP',
          status: 'OPEN',
          lastActivityAt: new Date(),
        },
      });

      // Create initial message
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          channel: 'WHATSAPP',
          direction: 'IN',
          from: contact.phone,
          to: '+50660213707',
          text: `${randomMessage} - ${contactData.name} (${contactData.role})`,
          timestamp: new Date(),
        },
      });

      console.log(`✅ ${contactData.name} (${contactData.phone}) - ${contactData.role}`);
      created++;
    }

    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created} conversations`);
    console.log(`   Skipped: ${skipped} (already existed)`);
    console.log(`   Total: ${corporateContacts.length} contacts`);

    console.log('\n✅ All corporate conversations created!');
    console.log('\n💡 Check the app at: https://skybot-inbox-ui.onrender.com');
    console.log('   Login: goodlife.nexxaagents / 4qFEZPjc8f');
    console.log('   Go to: Alerts > Filter "Corporativo"\n');

    await prisma.$disconnect();
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    await pool.end();
    throw error;
  }
}

createCorporateConversations();

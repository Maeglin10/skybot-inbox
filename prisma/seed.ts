import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const account =
    (await prisma.account.findFirst({ where: { name: 'Demo' } })) ??
    (await prisma.account.create({ data: { name: 'Demo' } }));

  // Inbox WHATSAPP
  const inboxWa = await prisma.inbox.upsert({
    where: {
      accountId_externalId: {
        accountId: account.id,
        externalId: 'demo-whatsapp',
      },
    },
    update: { name: 'Demo WhatsApp Inbox', channel: 'WHATSAPP' },
    create: {
      name: 'Demo WhatsApp Inbox',
      externalId: 'demo-whatsapp',
      accountId: account.id,
      channel: 'WHATSAPP',
    },
  });

  // Inbox EMAIL
  const inboxEmail = await prisma.inbox.upsert({
    where: {
      accountId_externalId: { accountId: account.id, externalId: 'demo-email' },
    },
    update: { name: 'Demo Email Inbox', channel: 'EMAIL' },
    create: {
      name: 'Demo Email Inbox',
      externalId: 'demo-email',
      accountId: account.id,
      channel: 'EMAIL',
    },
  });

  // Contact WhatsApp
  const contactWa = await prisma.contact.upsert({
    where: { inboxId_phone: { inboxId: inboxWa.id, phone: '573001112233' } },
    update: { name: 'Val', accountId: account.id },
    create: {
      accountId: account.id,
      inboxId: inboxWa.id,
      phone: '573001112233',
      name: 'Val',
    },
  });

  // Contact Email (si ton modèle Contact supporte email; sinon tu peux mettre phone fake)
  const contactEmail = await prisma.contact.upsert({
    where: { inboxId_phone: { inboxId: inboxEmail.id, phone: 'val@email' } },
    update: { name: 'Val (Email)', accountId: account.id },
    create: {
      accountId: account.id,
      inboxId: inboxEmail.id,
      phone: 'val@email',
      name: 'Val (Email)',
    },
  });

  // Conversation WhatsApp
  const convWa = await prisma.conversation.upsert({
    where: {
      conversation_channel_externalId_unique: {
        channel: 'WHATSAPP',
        externalId: 'wa-thread-1',
      },
    },
    update: {
      inboxId: inboxWa.id,
      contactId: contactWa.id,
      lastActivityAt: new Date(),
      status: 'OPEN',
    },
    create: {
      inboxId: inboxWa.id,
      contactId: contactWa.id,
      channel: 'WHATSAPP',
      externalId: 'wa-thread-1',
      status: 'OPEN',
      lastActivityAt: new Date(),
    },
  });

  // Conversation Email
  const convEmail = await prisma.conversation.upsert({
    where: {
      conversation_channel_externalId_unique: {
        channel: 'EMAIL',
        externalId: 'email-thread-1',
      },
    },
    update: {
      inboxId: inboxEmail.id,
      contactId: contactEmail.id,
      lastActivityAt: new Date(),
      status: 'PENDING',
    },
    create: {
      inboxId: inboxEmail.id,
      contactId: contactEmail.id,
      channel: 'EMAIL',
      externalId: 'email-thread-1',
      status: 'PENDING',
      lastActivityAt: new Date(),
    },
  });

  // Messages
  await prisma.message.upsert({
    where: {
      message_channel_externalId_unique: {
        channel: 'WHATSAPP',
        externalId: 'wa-msg-1',
      },
    },
    update: { text: 'Hola', timestamp: new Date() },
    create: {
      conversationId: convWa.id,
      channel: 'WHATSAPP',
      externalId: 'wa-msg-1',
      direction: 'IN',
      from: contactWa.phone,
      to: 'me',
      text: 'Hola',
      timestamp: new Date(),
    },
  });

  await prisma.message.upsert({
    where: {
      message_channel_externalId_unique: {
        channel: 'EMAIL',
        externalId: 'email-msg-1',
      },
    },
    update: { text: 'Hello from email', timestamp: new Date() },
    create: {
      conversationId: convEmail.id,
      channel: 'EMAIL',
      externalId: 'email-msg-1',
      direction: 'IN',
      from: 'val@email',
      to: 'support@demo',
      text: 'Hello from email',
      timestamp: new Date(),
    },
  });

  console.log('Seed OK');
}

main()
  .catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Seed failed:', msg);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

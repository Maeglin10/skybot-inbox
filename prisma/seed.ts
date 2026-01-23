import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // =========================
  // Account
  // =========================
  const account =
    (await prisma.account.findFirst({ where: { name: 'Demo' } })) ??
    (await prisma.account.create({ data: { name: 'Demo' } }));

  // =========================
  // Inboxes
  // =========================
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

  const inboxEmail = await prisma.inbox.upsert({
    where: {
      accountId_externalId: {
        accountId: account.id,
        externalId: 'demo-email',
      },
    },
    update: { name: 'Demo Email Inbox', channel: 'EMAIL' },
    create: {
      name: 'Demo Email Inbox',
      externalId: 'demo-email',
      accountId: account.id,
      channel: 'EMAIL',
    },
  });

  // =========================
  // Contacts
  // =========================
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

  // =========================
  // Conversations
  // =========================
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

  // =========================
  // Messages
  // =========================
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

  // =========================
  // ClientConfig (unique = accountId + clientKey)
  // =========================
  await prisma.clientConfig.upsert({
    where: {
      accountId_clientKey: { accountId: account.id, clientKey: 'demo' },
    },
    update: {
      status: 'ACTIVE',
      name: 'Demo',
      defaultAgentKey: 'master-router',
      allowedAgents: ['master-router', 'support', 'sales', 'smoke-test'],
      channels: ['WHATSAPP', 'EMAIL'],
      externalAccounts: [
        { channel: 'WHATSAPP', externalId: 'demo-whatsapp' },
        { channel: 'EMAIL', externalId: 'demo-email' },
      ],
    },
    create: {
      accountId: account.id,
      clientKey: 'demo',
      status: 'ACTIVE',
      name: 'Demo',
      defaultAgentKey: 'master-router',
      allowedAgents: ['master-router', 'support', 'sales', 'smoke-test'],
      channels: ['WHATSAPP', 'EMAIL'],
      externalAccounts: [
        { channel: 'WHATSAPP', externalId: 'demo-whatsapp' },
        { channel: 'EMAIL', externalId: 'demo-email' },
      ],
    },
  });

  await prisma.clientConfig.upsert({
    where: {
      accountId_clientKey: { accountId: account.id, clientKey: 'client1' },
    },
    update: {
      status: 'ACTIVE',
      name: 'Client 1',
      defaultAgentKey: 'master-router',
      allowedAgents: ['master-router'],
      channels: ['WHATSAPP'],
      externalAccounts: [
        { channel: 'WHATSAPP', externalId: 'client1-whatsapp-external-id' },
      ],
    },
    create: {
      accountId: account.id,
      clientKey: 'client1',
      status: 'ACTIVE',
      name: 'Client 1',
      defaultAgentKey: 'master-router',
      allowedAgents: ['master-router'],
      channels: ['WHATSAPP'],
      externalAccounts: [
        { channel: 'WHATSAPP', externalId: 'client1-whatsapp-external-id' },
      ],
    },
  });

  await prisma.clientConfig.upsert({
    where: {
      accountId_clientKey: { accountId: account.id, clientKey: 'client2' },
    },
    update: {
      status: 'ACTIVE',
      name: 'Client 2',
      defaultAgentKey: 'master-router',
      allowedAgents: ['master-router'],
      channels: ['WHATSAPP'],
      externalAccounts: [
        { channel: 'WHATSAPP', externalId: 'client2-whatsapp-external-id' },
      ],
    },
    create: {
      accountId: account.id,
      clientKey: 'client2',
      status: 'ACTIVE',
      name: 'Client 2',
      defaultAgentKey: 'master-router',
      allowedAgents: ['master-router'],
      channels: ['WHATSAPP'],
      externalAccounts: [
        { channel: 'WHATSAPP', externalId: 'client2-whatsapp-external-id' },
      ],
    },
  });

  // =========================
  // ExternalAccount (unique = accountId + channel + externalId)
  // =========================
  await prisma.externalAccount.upsert({
    where: {
      accountId_channel_externalId: {
        accountId: account.id,
        channel: 'WHATSAPP',
        externalId: 'demo-whatsapp',
      },
    },
    update: { clientKey: 'demo', isActive: true, name: 'Demo WhatsApp' },
    create: {
      accountId: account.id,
      channel: 'WHATSAPP',
      externalId: 'demo-whatsapp',
      clientKey: 'demo',
      isActive: true,
      name: 'Demo WhatsApp',
    },
  });

  await prisma.externalAccount.upsert({
    where: {
      accountId_channel_externalId: {
        accountId: account.id,
        channel: 'EMAIL',
        externalId: 'demo-email',
      },
    },
    update: { clientKey: 'demo', isActive: true, name: 'Demo Email' },
    create: {
      accountId: account.id,
      channel: 'EMAIL',
      externalId: 'demo-email',
      clientKey: 'demo',
      isActive: true,
      name: 'Demo Email',
    },
  });

  await prisma.externalAccount.upsert({
    where: {
      accountId_channel_externalId: {
        accountId: account.id,
        channel: 'WHATSAPP',
        externalId: 'client1-whatsapp-external-id',
      },
    },
    update: { clientKey: 'client1', isActive: true, name: 'Client1 WhatsApp' },
    create: {
      accountId: account.id,
      channel: 'WHATSAPP',
      externalId: 'client1-whatsapp-external-id',
      clientKey: 'client1',
      isActive: true,
      name: 'Client1 WhatsApp',
    },
  });

  await prisma.externalAccount.upsert({
    where: {
      accountId_channel_externalId: {
        accountId: account.id,
        channel: 'WHATSAPP',
        externalId: 'client2-whatsapp-external-id',
      },
    },
    update: { clientKey: 'client2', isActive: true, name: 'Client2 WhatsApp' },
    create: {
      accountId: account.id,
      channel: 'WHATSAPP',
      externalId: 'client2-whatsapp-external-id',
      clientKey: 'client2',
      isActive: true,
      name: 'Client2 WhatsApp',
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
  });

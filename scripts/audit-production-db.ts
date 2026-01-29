#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';

// Use production DATABASE_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function auditProductionDB() {
  console.log('\n🔍 AUDIT DE LA BASE DE DONNÉES PRODUCTION\n');
  console.log('='.repeat(60));

  try {
    // 1. ACCOUNTS
    console.log('\n📊 1. COMPTES (Accounts)');
    console.log('-'.repeat(60));
    const accounts = await prisma.account.findMany({
      include: {
        _count: {
          select: {
            users: true,
            inboxes: true,
            conversations: true,
          },
        },
      },
    });

    for (const account of accounts) {
      console.log(`\n✅ ${account.name}`);
      console.log(`   ID: ${account.id}`);
      console.log(`   Users: ${account._count.users}`);
      console.log(`   Inboxes: ${account._count.inboxes}`);
      console.log(`   Conversations: ${account._count.conversations}`);
    }

    // 2. USERS
    console.log('\n\n👤 2. UTILISATEURS (UserAccounts)');
    console.log('-'.repeat(60));
    const users = await prisma.userAccount.findMany({
      include: {
        account: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const user of users) {
      console.log(`\n   ${user.email}`);
      console.log(`   Account: ${user.account?.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
    }

    // 3. INBOXES
    console.log('\n\n📥 3. INBOXES');
    console.log('-'.repeat(60));
    const inboxes = await prisma.inbox.findMany({
      include: {
        account: true,
        _count: {
          select: { conversations: true },
        },
      },
    });

    for (const inbox of inboxes) {
      console.log(`\n   ${inbox.name}`);
      console.log(`   Account: ${inbox.account.name}`);
      console.log(`   Channel: ${inbox.channel}`);
      console.log(`   External ID: ${inbox.externalId}`);
      console.log(`   Conversations: ${inbox._count.conversations}`);
    }

    // 4. CORPORATE CONTACTS
    console.log('\n\n🏢 4. CONTACTS CORPORATE (isCorporate: true)');
    console.log('-'.repeat(60));
    const corporateContacts = await prisma.contact.findMany({
      where: { isCorporate: true },
      include: {
        account: true,
      },
    });

    console.log(`\nTotal Corporate Contacts: ${corporateContacts.length}\n`);

    for (const contact of corporateContacts) {
      console.log(`   ${contact.name || 'No name'}`);
      console.log(`   Phone: ${contact.phone}`);
      console.log(`   Account: ${contact.account?.name}`);
      console.log(`   Created: ${contact.createdAt.toISOString()}\n`);
    }

    // 5. CLIENT CONFIGS
    console.log('\n📋 5. CLIENT CONFIGS');
    console.log('-'.repeat(60));
    const clientConfigs = await prisma.clientConfig.findMany({
      include: {
        account: true,
      },
    });

    for (const config of clientConfigs) {
      console.log(`\n   ${config.name || config.clientKey}`);
      console.log(`   Account: ${config.account.name}`);
      console.log(`   Client Key: ${config.clientKey}`);
      console.log(`   Status: ${config.status}`);
      console.log(`   Channels: ${config.channels.join(', ')}`);
    }

    // 6. EXTERNAL ACCOUNTS
    console.log('\n\n🔗 6. EXTERNAL ACCOUNTS (WhatsApp mapping)');
    console.log('-'.repeat(60));
    const externalAccounts = await prisma.externalAccount.findMany({
      include: {
        account: true,
      },
    });

    for (const extAccount of externalAccounts) {
      console.log(`\n   ${extAccount.name || extAccount.channel}`);
      console.log(`   Account: ${extAccount.account.name}`);
      console.log(`   Channel: ${extAccount.channel}`);
      console.log(`   External ID: ${extAccount.externalId}`);
      console.log(`   Client Key: ${extAccount.clientKey}`);
    }

    // 7. CONVERSATIONS RECENTES
    console.log('\n\n💬 7. CONVERSATIONS RÉCENTES (top 10)');
    console.log('-'.repeat(60));
    const conversations = await prisma.conversation.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: {
        contact: true,
        inbox: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    for (const conv of conversations) {
      console.log(`\n   ${conv.contact?.name || 'Unknown'} (${conv.contact?.phone})`);
      console.log(`   Inbox: ${conv.inbox.name}`);
      console.log(`   Status: ${conv.status}`);
      console.log(`   Messages: ${conv._count.messages}`);
      console.log(`   Updated: ${conv.updatedAt.toISOString()}`);
    }

    // 8. STATS GLOBALES
    console.log('\n\n📈 8. STATISTIQUES GLOBALES');
    console.log('-'.repeat(60));

    const totalAccounts = await prisma.account.count();
    const totalUsers = await prisma.userAccount.count();
    const totalInboxes = await prisma.inbox.count();
    const totalContacts = await prisma.contact.count();
    const totalCorporateContacts = await prisma.contact.count({
      where: { isCorporate: true },
    });
    const totalConversations = await prisma.conversation.count();
    const totalMessages = await prisma.message.count();

    console.log(`\n   Accounts: ${totalAccounts}`);
    console.log(`   Users: ${totalUsers}`);
    console.log(`   Inboxes: ${totalInboxes}`);
    console.log(`   Contacts: ${totalContacts}`);
    console.log(`   Corporate Contacts: ${totalCorporateContacts}`);
    console.log(`   Conversations: ${totalConversations}`);
    console.log(`   Messages: ${totalMessages}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ AUDIT TERMINÉ\n');

    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ ERREUR LORS DE L\'AUDIT:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

auditProductionDB();

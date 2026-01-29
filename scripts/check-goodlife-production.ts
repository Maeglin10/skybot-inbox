#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const prisma = new PrismaClient();

async function checkGoodLifeProduction() {
  console.log('🔍 Vérification GoodLife Production\n');

  // 1. Compte GoodLife
  const account = await prisma.account.findFirst({
    where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
  });

  if (!account) {
    console.log('❌ COMPTE GOODLIFE NON TROUVÉ');
    console.log('   → Exécutez: npx ts-node scripts/setup-goodlife-production.ts\n');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`✅ Compte: ${account.name}`);
  console.log(`   ID: ${account.id}\n`);

  // 2. Utilisateur
  const user = await prisma.userAccount.findFirst({
    where: { username: 'goodlife.nexxaagents' },
  });

  if (!user) {
    console.log('❌ UTILISATEUR GOODLIFE.NEXXAAGENTS NON TROUVÉ');
    console.log('   → Exécutez: npx ts-node scripts/setup-goodlife-production.ts\n');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`✅ User: ${user.username}`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Account ID: ${user.accountId}`);
  console.log(`   Status: ${user.status}`);
  console.log(`   Role: ${user.role}`);

  // Vérifier le mot de passe
  const password = '4qFEZPjc8f';
  const isValid = user.passwordHash
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  console.log(`   Password Hash: ${user.passwordHash ? 'EXISTS' : 'MISSING'}`);
  console.log(`   Password Valid: ${isValid ? '✅ OUI' : '❌ NON'}\n`);

  if (!isValid) {
    console.log('⚠️  LE MOT DE PASSE EST INVALIDE');
    console.log('   → Exécutez: npx ts-node scripts/setup-goodlife-production.ts\n');
  }

  // 3. Conversations
  const conversations = await prisma.conversation.findMany({
    where: {
      inbox: {
        accountId: account.id,
      },
    },
    include: {
      contact: true,
      messages: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
    orderBy: {
      lastActivityAt: 'desc',
    },
  });

  console.log(`📬 Conversations: ${conversations.length}\n`);

  if (conversations.length === 0) {
    console.log('❌ AUCUNE CONVERSATION TROUVÉE');
    console.log('   → Exécutez: npx ts-node scripts/setup-goodlife-production.ts\n');
  } else {
    conversations.forEach((conv, idx) => {
      console.log(`   ${idx + 1}. ${conv.contact.name} (${conv.contact.phone})`);
      console.log(`      Corporate: ${conv.contact.isCorporate ? 'OUI' : 'NON'}`);
      console.log(`      Status: ${conv.status}`);
      if (conv.messages[0]) {
        const text = conv.messages[0].text?.substring(0, 50) || 'N/A';
        console.log(`      Message: "${text}..."`);
      }
      console.log('');
    });
  }

  // 4. Inbox
  const inbox = await prisma.inbox.findFirst({
    where: { accountId: account.id },
  });

  if (inbox) {
    console.log(`✅ Inbox: ${inbox.name}`);
    console.log(`   ID: ${inbox.id}`);
    console.log(`   External ID: ${inbox.externalId}\n`);
  } else {
    console.log('❌ INBOX NON TROUVÉE\n');
  }

  // Résumé
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 RÉSUMÉ');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Compte GoodLife:      ${account ? '✅' : '❌'}`);
  console.log(`User goodlife.nexxaagents: ${user ? '✅' : '❌'}`);
  console.log(`Password valide:      ${isValid ? '✅' : '❌'}`);
  console.log(`Inbox:                ${inbox ? '✅' : '❌'}`);
  console.log(`Conversations:        ${conversations.length}`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (!isValid || conversations.length === 0) {
    console.log('⚠️  ACTION REQUISE:');
    console.log('   Exécutez: npx ts-node scripts/setup-goodlife-production.ts\n');
  } else {
    console.log('✅ TOUT EST OK - GoodLife peut se connecter\n');
  }

  await prisma.$disconnect();
}

checkGoodLifeProduction().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

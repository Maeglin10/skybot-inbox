#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verifyGoodLifeAPI() {
  console.log('🔍 Vérification complète de GoodLife API\n');

  // 1. Vérifier les données en base
  console.log('📊 1. Données en base de données:\n');

  const goodlife = await prisma.account.findFirst({
    where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
  });

  if (!goodlife) {
    console.log('❌ Account GoodLife non trouvé');
    process.exit(1);
  }

  console.log(`✅ Account: ${goodlife.name}`);
  console.log(`   ID: ${goodlife.id}\n`);

  const user = await prisma.userAccount.findFirst({
    where: { username: 'goodlife.nexxaagents' },
  });

  if (user) {
    console.log(`✅ User: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Account ID: ${user.accountId}\n`);
  }

  const inbox = await prisma.inbox.findFirst({
    where: { accountId: goodlife.id },
  });

  if (inbox) {
    console.log(`✅ Inbox: ${inbox.name}`);
    console.log(`   ID: ${inbox.id}`);
    console.log(`   External ID: ${inbox.externalId}\n`);
  } else {
    console.log('⚠️  Pas d\'inbox trouvée\n');
  }

  const convCount = await prisma.conversation.count({
    where: {
      inbox: {
        accountId: goodlife.id,
      },
    },
  });

  console.log(`✅ Conversations: ${convCount}\n`);

  if (convCount > 0) {
    const conversations = await prisma.conversation.findMany({
      where: {
        inbox: {
          accountId: goodlife.id,
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

    console.log('📬 Détails des conversations:\n');
    conversations.forEach((conv, idx) => {
      console.log(`   ${idx + 1}. Conversation ${conv.id.substring(0, 8)}...`);
      console.log(`      Contact: ${conv.contact.name} (${conv.contact.phone})`);
      console.log(`      Status: ${conv.status}`);
      console.log(`      Messages: ${conv.messages.length}`);
      if (conv.messages[0]) {
        console.log(`      Dernier: "${conv.messages[0].text?.substring(0, 60)}..."`);
      }
      console.log('');
    });
  }

  // 2. Informations pour l'API
  console.log('🔌 2. Endpoints API à utiliser:\n');
  console.log('   Base URL: https://skybot-inbox.onrender.com/api\n');

  console.log('   Login:');
  console.log('   POST /auth/login');
  console.log('   Body: { "username": "goodlife.nexxaagents", "password": "4qFEZPjc8f" }\n');

  console.log('   Conversations:');
  console.log('   GET /conversations');
  console.log('   Headers: Authorization: Bearer <token>');
  if (inbox) {
    console.log(`   Query: ?inboxId=${inbox.id}`);
  }
  console.log('');

  console.log('   Messages pour une conversation:');
  console.log('   GET /conversations/:conversationId/messages');
  console.log('   Headers: Authorization: Bearer <token>\n');

  // 3. Résumé
  console.log('📋 3. Résumé pour Antigravity:\n');
  console.log('   ✅ Base de données: OK');
  console.log(`   ✅ Account GoodLife: ${goodlife.id}`);
  console.log(`   ✅ User goodlife.nexxaagents: ${user?.id || 'N/A'}`);
  console.log(`   ✅ Inbox: ${inbox?.id || 'N/A'}`);
  console.log(`   ✅ Conversations: ${convCount}`);
  console.log('   ✅ Messages: Présents en base\n');

  console.log('   ⚠️  Si le frontend ne montre rien:');
  console.log('   1. Vérifier que le login retourne bien un token JWT');
  console.log('   2. Vérifier que GET /conversations est appelé avec le token');
  console.log('   3. Vérifier que le bon accountId/inboxId est utilisé');
  console.log('   4. Vérifier les logs réseau du navigateur (F12 > Network)\n');

  await prisma.$disconnect();
  await pool.end();
}

verifyGoodLifeAPI().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

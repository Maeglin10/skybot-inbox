#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as readline from 'readline';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupGoodLife() {
  console.log('🚀 GoodLife Setup Script\n');
  console.log('Ce script va configurer automatiquement le compte GoodLife.\n');

  // 1. Vérifier que le compte GoodLife existe
  console.log('📦 Étape 1: Vérification du compte GoodLife...');
  const goodLifeAccount = await prisma.account.findFirst({
    where: { name: 'GoodLife' },
  });

  if (!goodLifeAccount) {
    console.log('❌ Compte GoodLife non trouvé en base !');
    console.log('   Exécute d\'abord: npm run db:seed');
    process.exit(1);
  }

  console.log(`   ✅ Compte trouvé: ${goodLifeAccount.name} (${goodLifeAccount.id})`);

  // 2. Vérifier l'utilisateur
  console.log('\n👤 Étape 2: Vérification de l\'utilisateur...');
  const goodLifeUser = await prisma.userAccount.findFirst({
    where: {
      accountId: goodLifeAccount.id,
      username: 'goodlife.nexxaagents',
    },
  });

  if (!goodLifeUser) {
    console.log('❌ Utilisateur goodlife.nexxaagents non trouvé !');
    process.exit(1);
  }

  console.log(`   ✅ Utilisateur trouvé: ${goodLifeUser.email}`);

  // 3. Créer ou mettre à jour ClientConfig
  console.log('\n⚙️  Étape 3: Configuration du ClientConfig...');

  let existingConfig = await prisma.clientConfig.findFirst({
    where: { clientKey: 'goodlife' },
  });

  if (existingConfig) {
    console.log('   ⚠️  ClientConfig "goodlife" existe déjà');
    const shouldUpdate = await askQuestion('   Voulez-vous le mettre à jour ? (y/n): ');

    if (shouldUpdate.toLowerCase() === 'y') {
      await prisma.clientConfig.delete({ where: { id: existingConfig.id } });
      existingConfig = null;
      console.log('   ✅ Ancien ClientConfig supprimé');
    }
  }

  if (!existingConfig) {
    const clientConfig = await prisma.clientConfig.create({
      data: {
        accountId: goodLifeAccount.id,
        clientKey: 'goodlife',
        name: 'GoodLife WhatsApp',
        status: 'ACTIVE',
        defaultAgentKey: 'master-router',
        allowedAgents: ['master-router', 'setter', 'closer', 'crm'],
        channels: ['WHATSAPP'],
        externalAccounts: {},
      },
    });
    console.log(`   ✅ ClientConfig créé: ${clientConfig.clientKey}`);
  }

  // 4. Configuration WhatsApp
  console.log('\n📱 Étape 4: Configuration WhatsApp...');
  console.log('\n   Pour configurer WhatsApp, tu dois:');
  console.log('   1. Aller sur Meta Business Manager');
  console.log('   2. Ajouter le numéro WhatsApp de GoodLife');
  console.log('   3. Récupérer le "phone_number_id"\n');

  const hasPhoneNumberId = await askQuestion('   As-tu déjà le phone_number_id ? (y/n): ');

  if (hasPhoneNumberId.toLowerCase() === 'y') {
    const phoneNumberId = await askQuestion('   Entre le phone_number_id: ');

    // Vérifier si ExternalAccount existe
    let existingExternal = await prisma.externalAccount.findFirst({
      where: {
        accountId: goodLifeAccount.id,
        channel: 'WHATSAPP',
      },
    });

    if (existingExternal) {
      console.log('   ⚠️  ExternalAccount WhatsApp existe déjà');
      const shouldUpdate = await askQuestion('   Voulez-vous le mettre à jour ? (y/n): ');

      if (shouldUpdate.toLowerCase() === 'y') {
        await prisma.externalAccount.delete({ where: { id: existingExternal.id } });
        existingExternal = null;
        console.log('   ✅ Ancien ExternalAccount supprimé');
      }
    }

    if (!existingExternal) {
      const externalAccount = await prisma.externalAccount.create({
        data: {
          accountId: goodLifeAccount.id,
          channel: 'WHATSAPP',
          externalId: phoneNumberId.trim(),
          clientKey: 'goodlife',
          name: 'GoodLife WhatsApp',
          isActive: true,
        },
      });
      console.log(`   ✅ ExternalAccount créé avec phone_number_id: ${phoneNumberId}`);
    }
  } else {
    console.log('\n   ⏭️  Passe cette étape pour l\'instant.');
    console.log('   Tu pourras lancer ce script à nouveau après avoir obtenu le phone_number_id.\n');
  }

  // 5. Résumé final
  console.log('\n✨ Setup GoodLife terminé !\n');
  console.log('📊 Résumé:');
  console.log(`   - Account: ${goodLifeAccount.name} (${goodLifeAccount.id})`);
  console.log(`   - User: ${goodLifeUser.username} / ${goodLifeUser.email}`);
  console.log(`   - ClientKey: goodlife`);
  console.log(`   - Channels: WHATSAPP`);

  const hasPhoneId = await prisma.externalAccount.findFirst({
    where: { accountId: goodLifeAccount.id, channel: 'WHATSAPP' },
  });

  if (hasPhoneId) {
    console.log(`   - Phone Number ID: ${hasPhoneId.externalId}`);
  } else {
    console.log(`   - Phone Number ID: ⚠️  Non configuré`);
  }

  console.log('\n📋 Prochaines étapes:');
  console.log('   1. Ajouter JWT_SECRET dans Render > skybot-inbox > Environment');
  console.log('   2. Ajouter SEED_SECRET_KEY dans Render > skybot-inbox > Environment');
  console.log('   3. Tester la connexion: goodlife.nexxaagents');
  console.log('   4. Configurer le webhook WhatsApp dans Meta Business Manager\n');

  rl.close();
  await prisma.$disconnect();
  await pool.end();
}

setupGoodLife().catch((error) => {
  console.error('❌ Erreur:', error);
  rl.close();
  process.exit(1);
});

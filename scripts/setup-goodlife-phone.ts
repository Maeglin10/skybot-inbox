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

async function setupGoodLifePhone() {
  const phoneNumberId = process.argv[2] || '60925012724039335';

  console.log('📱 Configuration du phone_number_id GoodLife...\n');
  console.log(`   Phone Number ID: ${phoneNumberId}\n`);

  // 1. Trouver le compte GoodLife
  const goodLifeAccount = await prisma.account.findFirst({
    where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
  });

  if (!goodLifeAccount) {
    console.log('❌ Compte GoodLife non trouvé !');
    process.exit(1);
  }

  console.log(`✅ Compte: ${goodLifeAccount.name}\n`);

  // 2. Créer ou mettre à jour ClientConfig
  let clientConfig = await prisma.clientConfig.findFirst({
    where: { clientKey: 'goodlife' },
  });

  if (!clientConfig) {
    clientConfig = await prisma.clientConfig.create({
      data: {
        clientKey: 'goodlife',
        name: 'GoodLife Costa Rica',
        accountId: goodLifeAccount.id,
        channels: ['WHATSAPP'],
        allowedAgents: ['master-router'],
        externalAccounts: [],
        status: 'ACTIVE',
      },
    });
    console.log('✅ ClientConfig créé\n');
  } else {
    console.log('✅ ClientConfig existe déjà\n');
  }

  // 3. Vérifier si ExternalAccount existe déjà
  const existingExternal = await prisma.externalAccount.findFirst({
    where: {
      accountId: goodLifeAccount.id,
      channel: 'WHATSAPP',
      externalId: phoneNumberId,
    },
  });

  if (existingExternal) {
    console.log('⚠️  ExternalAccount existe déjà pour ce phone_number_id');
    console.log(`   ID: ${existingExternal.id}`);
    console.log(`   Name: ${existingExternal.name}`);
    console.log(`   Active: ${existingExternal.isActive}\n`);
  } else {
    // Créer l'ExternalAccount
    const externalAccount = await prisma.externalAccount.create({
      data: {
        accountId: goodLifeAccount.id,
        channel: 'WHATSAPP',
        externalId: phoneNumberId,
        clientKey: 'goodlife',
        name: 'GoodLife WhatsApp',
        isActive: true,
      },
    });

    console.log('✅ ExternalAccount créé !');
    console.log(`   ID: ${externalAccount.id}`);
    console.log(`   Phone Number ID: ${externalAccount.externalId}\n`);
  }

  console.log('✨ Configuration terminée !\n');
  console.log('📋 Prochaine étape: Tester avec npm run test:webhook-routing\n');

  await prisma.$disconnect();
  await pool.end();
}

setupGoodLifePhone().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

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

async function testWebhookRouting() {
  console.log('🔍 Test du routing webhook WhatsApp\n');

  // 1. Lister tous les ExternalAccounts WhatsApp
  console.log('📱 ExternalAccounts WhatsApp configurés:\n');

  const externalAccounts = await prisma.externalAccount.findMany({
    where: { channel: 'WHATSAPP' },
    include: {
      account: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  if (externalAccounts.length === 0) {
    console.log('   ⚠️  Aucun ExternalAccount WhatsApp configuré !');
    console.log('   → Pour Nexxa : Déjà configuré dans le seed');
    console.log('   → Pour GoodLife : Lance npm run setup:goodlife\n');
  } else {
    for (const ext of externalAccounts) {
      console.log(`   📞 ${ext.name || 'Sans nom'}`);
      console.log(`      - Phone Number ID: ${ext.externalId}`);
      console.log(`      - Account: ${ext.account.name} (${ext.account.status})`);
      console.log(`      - ClientKey: ${ext.clientKey}`);
      console.log(`      - Active: ${ext.isActive ? '✅' : '❌'}`);
      console.log('');
    }
  }

  // 2. Simuler le routing pour chaque phone_number_id
  console.log('🧪 Simulation du routing:\n');

  for (const ext of externalAccounts) {
    console.log(`   Test phone_number_id: ${ext.externalId}`);

    // Simuler la recherche que fait le webhook
    const foundAccount = await prisma.externalAccount.findFirst({
      where: {
        channel: 'WHATSAPP',
        externalId: ext.externalId,
      },
      include: {
        account: true,
      },
    });

    if (foundAccount) {
      console.log(`   ✅ Routé vers: ${foundAccount.account.name}`);
      console.log(`      - Account ID: ${foundAccount.accountId}`);
      console.log(`      - ClientKey: ${foundAccount.clientKey}`);
    } else {
      console.log(`   ❌ Aucun routing trouvé !`);
    }
    console.log('');
  }

  // 3. Vérifier les ClientConfigs
  console.log('⚙️  ClientConfigs actifs:\n');

  const clientConfigs = await prisma.clientConfig.findMany({
    where: { status: 'ACTIVE' },
  });

  for (const config of clientConfigs) {
    console.log(`   🔧 ${config.name || config.clientKey}`);
    console.log(`      - ClientKey: ${config.clientKey}`);
    const channels = Array.isArray(config.channels) ? config.channels.join(', ') : JSON.stringify(config.channels);
    console.log(`      - Channels: ${channels}`);
    console.log(`      - Default Agent: ${config.defaultAgentKey || 'Non défini'}`);
    console.log('');
  }

  // 4. Résumé final
  console.log('📊 Résumé du routing:\n');

  const totalExternalAccounts = externalAccounts.length;
  const activeExternalAccounts = externalAccounts.filter(e => e.isActive).length;
  const totalClientConfigs = clientConfigs.length;

  console.log(`   - ExternalAccounts WhatsApp: ${totalExternalAccounts} (${activeExternalAccounts} actifs)`);
  console.log(`   - ClientConfigs actifs: ${totalClientConfigs}`);

  if (totalExternalAccounts === 0) {
    console.log('\n⚠️  Action requise:');
    console.log('   1. Lance npm run setup:goodlife');
    console.log('   2. Entre le phone_number_id de GoodLife');
    console.log('   3. Relance ce test\n');
  } else if (totalExternalAccounts === 1) {
    console.log('\n⚠️  Un seul numéro configuré:');
    console.log('   - Probablement Nexxa uniquement');
    console.log('   - Lance npm run setup:goodlife pour ajouter GoodLife\n');
  } else {
    console.log('\n✅ Routing configuré pour plusieurs comptes !');
    console.log('   Chaque message sera routé vers le bon compte automatiquement.\n');
  }

  await prisma.$disconnect();
  await pool.end();
}

testWebhookRouting().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

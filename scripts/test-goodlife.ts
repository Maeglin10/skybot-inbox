#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const prisma = new PrismaClient();

async function testGoodLife() {
  console.log('🧪 GoodLife Tests\n');

  // Test 1: Compte et utilisateur
  console.log('📦 Test 1: Vérification du compte...');
  const account = await prisma.account.findFirst({
    where: { name: 'GoodLife' },
    include: {
      _count: {
        select: {
          alerts: true,
          leads: true,
          feedbacks: true,
          userAccounts: true,
        },
      },
    },
  });

  if (!account) {
    console.log('   ❌ Compte GoodLife non trouvé !');
    return;
  }

  console.log(`   ✅ Compte trouvé: ${account.name}`);
  console.log(`      - ID: ${account.id}`);
  console.log(`      - Status: ${account.status}`);
  console.log(`      - Alerts: ${account._count.alerts}`);
  console.log(`      - Leads: ${account._count.leads}`);
  console.log(`      - Feedbacks: ${account._count.feedbacks}`);
  console.log(`      - Users: ${account._count.userAccounts}`);

  // Test 2: Utilisateur
  console.log('\n👤 Test 2: Vérification de l\'utilisateur...');
  const user = await prisma.userAccount.findFirst({
    where: {
      accountId: account.id,
      username: 'goodlife.nexxaagents',
    },
  });

  if (!user) {
    console.log('   ❌ Utilisateur non trouvé !');
    return;
  }

  console.log(`   ✅ Utilisateur trouvé: ${user.username}`);
  console.log(`      - Email: ${user.email}`);
  console.log(`      - Role: ${user.role}`);
  console.log(`      - Status: ${user.status}`);

  // Test 3: ClientConfig
  console.log('\n⚙️  Test 3: Vérification du ClientConfig...');
  const clientConfig = await prisma.clientConfig.findFirst({
    where: { clientKey: 'goodlife' },
  });

  if (!clientConfig) {
    console.log('   ❌ ClientConfig non trouvé !');
    console.log('   → Exécute: npx ts-node scripts/setup-goodlife.ts');
  } else {
    console.log(`   ✅ ClientConfig trouvé: ${clientConfig.name}`);
    console.log(`      - ClientKey: ${clientConfig.clientKey}`);
    console.log(`      - Status: ${clientConfig.status}`);
    const channels = Array.isArray(clientConfig.channels) ? clientConfig.channels.join(', ') : JSON.stringify(clientConfig.channels);
    console.log(`      - Channels: ${channels}`);
    console.log(`      - Account: ${clientConfig.accountId === account.id ? '✅ Correct' : '❌ Incorrect'}`);
  }

  // Test 4: ExternalAccount (WhatsApp)
  console.log('\n📱 Test 4: Vérification WhatsApp...');
  const externalAccount = await prisma.externalAccount.findFirst({
    where: {
      accountId: account.id,
      channel: 'WHATSAPP',
    },
  });

  if (!externalAccount) {
    console.log('   ⚠️  ExternalAccount WhatsApp non configuré');
    console.log('   → Configure le phone_number_id avec: npx ts-node scripts/setup-goodlife.ts');
  } else {
    console.log(`   ✅ WhatsApp configuré: ${externalAccount.name}`);
    console.log(`      - Phone Number ID: ${externalAccount.externalId}`);
    console.log(`      - ClientKey: ${externalAccount.clientKey}`);
  }

  // Test 5: Isolation multi-tenant
  console.log('\n🔒 Test 5: Isolation multi-tenant...');
  const demoAccount = await prisma.account.findFirst({
    where: { isDemo: true },
  });

  if (demoAccount) {
    const demoAlerts = await prisma.alert.count({
      where: { accountId: demoAccount.id },
    });

    const goodlifeAlerts = await prisma.alert.count({
      where: { accountId: account.id },
    });

    console.log(`   Demo account alerts: ${demoAlerts}`);
    console.log(`   GoodLife account alerts: ${goodlifeAlerts}`);

    if (demoAlerts > 0 && goodlifeAlerts === 0) {
      console.log('   ✅ Isolation OK: Les comptes ont des données séparées');
    } else if (goodlifeAlerts === 0) {
      console.log('   ⚠️  GoodLife n\'a pas encore de données (normal au début)');
    }
  }

  // Résumé final
  console.log('\n📊 Résumé des tests:');
  const checks = {
    account: !!account,
    user: !!user,
    clientConfig: !!clientConfig,
    whatsapp: !!externalAccount,
  };

  const passedTests = Object.values(checks).filter(Boolean).length;
  const totalTests = Object.keys(checks).length;

  console.log(`   Tests réussis: ${passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log('\n✨ Tous les tests sont passés ! GoodLife est prêt à être testé.\n');
    console.log('📋 Prochaines étapes:');
    console.log('   1. Teste la connexion sur https://skybot-inbox-ui.onrender.com');
    console.log('   2. Username: goodlife.nexxaagents');
    console.log('   3. Vérifie que le dashboard s\'affiche sans erreurs');
    console.log('   4. Vérifie qu\'il ne voit PAS les données Demo/Nexxa\n');
  } else {
    console.log('\n⚠️  Certains tests ont échoué. Consulte les détails ci-dessus.\n');
  }

  await prisma.$disconnect();
}

testGoodLife().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

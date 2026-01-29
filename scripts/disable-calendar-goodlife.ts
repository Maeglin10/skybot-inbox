#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const prisma = new PrismaClient();

async function disableCalendarForGoodLife() {
  console.log('🗓️  Désactivation du calendrier pour GoodLife...\n');

  const goodLifeAccount = await prisma.account.findFirst({
    where: { name: 'GoodLife' },
  });

  if (!goodLifeAccount) {
    console.log('❌ Compte GoodLife non trouvé !');
    return;
  }

  console.log(`✅ Compte trouvé: ${goodLifeAccount.name}\n`);

  // Mettre à jour les features
  const updated = await prisma.account.update({
    where: { id: goodLifeAccount.id },
    data: {
      features: {
        inbox: true,
        crm: true,
        analytics: true,
        alerts: true,
        settings: true,
        calendar: false, // Désactivé
      },
    },
  });

  console.log('✅ Features mises à jour:');
  console.log(`   - Inbox: ${(updated.features as any).inbox ? '✅' : '❌'}`);
  console.log(`   - CRM: ${(updated.features as any).crm ? '✅' : '❌'}`);
  console.log(`   - Analytics: ${(updated.features as any).analytics ? '✅' : '❌'}`);
  console.log(`   - Alerts: ${(updated.features as any).alerts ? '✅' : '❌'}`);
  console.log(`   - Settings: ${(updated.features as any).settings ? '✅' : '❌'}`);
  console.log(`   - Calendar: ${(updated.features as any).calendar ? '✅ (actif)' : '❌ (désactivé)'}\n`);

  console.log('✨ Le calendrier est maintenant désactivé pour GoodLife !');

  await prisma.$disconnect();
}

disableCalendarForGoodLife().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

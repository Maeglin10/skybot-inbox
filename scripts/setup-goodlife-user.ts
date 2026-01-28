#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function setupGoodlifeUser() {
  console.log('👤 Configuration du compte GoodLife Agents...\n');

  // 1. Trouver le compte GoodLife
  const goodLifeAccount = await prisma.account.findFirst({
    where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
  });

  if (!goodLifeAccount) {
    console.log('❌ Compte GoodLife non trouvé !');
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  }

  console.log(`✅ Account trouvé: ${goodLifeAccount.name}\n`);

  // 2. Vérifier si l'utilisateur existe
  const existingUser = await prisma.userAccount.findFirst({
    where: { username: 'goodlife.nexxaagents' },
  });

  const password = '4qFEZPjc8f';
  const passwordHash = await bcrypt.hash(password, 10);

  if (existingUser) {
    console.log('📝 Utilisateur existant trouvé, mise à jour...\n');

    await prisma.userAccount.update({
      where: { id: existingUser.id },
      data: {
        passwordHash,
        email: 'goodlife.agents@nexxa.com',
        status: 'ACTIVE',
        accountId: goodLifeAccount.id,
      },
    });

    console.log('✅ Utilisateur mis à jour !');
  } else {
    console.log('🆕 Création du nouvel utilisateur...\n');

    const newUser = await prisma.userAccount.create({
      data: {
        accountId: goodLifeAccount.id,
        username: 'goodlife.nexxaagents',
        email: 'goodlife.agents@nexxa.com',
        passwordHash,
        name: 'GoodLife Agent',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    // Créer les préférences par défaut
    await prisma.userPreference.create({
      data: {
        userAccountId: newUser.id,
        theme: 'DEFAULT',
        language: 'ES',
        timezone: 'UTC',
      },
    });

    console.log('✅ Utilisateur créé avec succès !');
  }

  console.log('\n📋 Identifiants de connexion:');
  console.log('   Username: goodlife.nexxaagents');
  console.log('   Password: 4qFEZPjc8f');
  console.log('   URL: https://skybot-inbox-ui.onrender.com\n');

  await prisma.$disconnect();
  await pool.end();
}

setupGoodlifeUser();

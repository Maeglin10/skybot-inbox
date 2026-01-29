#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const prisma = new PrismaClient();

async function setGoodlifePassword() {
  console.log('🔐 Mise à jour du mot de passe Goodlife...\n');

  const goodlife = await prisma.userAccount.findFirst({
    where: { username: 'goodlife-admin' },
  });

  if (!goodlife) {
    console.log('❌ Utilisateur goodlife-admin non trouvé !');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`✅ Utilisateur trouvé: ${goodlife.email}\n`);

  const password = '4qFEZPjc8f';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.userAccount.update({
    where: { id: goodlife.id },
    data: { passwordHash },
  });

  console.log('✅ Mot de passe mis à jour !');
  console.log(`   Username: goodlife-admin`);
  console.log(`   Password: ${password}\n`);

  await prisma.$disconnect();
}

setGoodlifePassword();

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

async function ensureGoodLifeExists() {
  console.log('🔍 Vérification rapide GoodLife...');

  try {
    // Vérifier si GoodLife existe
    const account = await prisma.account.findFirst({
      where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
    });

    if (account) {
      console.log('✅ GoodLife existe déjà');
      await prisma.$disconnect();
      await pool.end();
      return;
    }

    // GoodLife n'existe pas - le recréer automatiquement
    console.log('⚠️  GoodLife manquant - recréation automatique...');

    const newAccount = await prisma.account.create({
      data: {
        name: 'Goodlife Costa Rica',
        status: 'ACTIVE',
      },
    });

    const passwordHash = await bcrypt.hash('4qFEZPjc8f', 10);
    const user = await prisma.userAccount.create({
      data: {
        accountId: newAccount.id,
        username: 'goodlife.nexxaagents',
        email: 'ventas@goodlifecr.com',
        passwordHash,
        name: 'GoodLife Agent',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    await prisma.userPreference.create({
      data: {
        userAccountId: user.id,
        theme: 'DEFAULT',
        language: 'ES',
        timezone: 'UTC',
      },
    });

    const inbox = await prisma.inbox.create({
      data: {
        accountId: newAccount.id,
        externalId: '60925012724039335',
        name: 'WhatsApp GoodLife',
        channel: 'WHATSAPP',
      },
    });

    await prisma.clientConfig.create({
      data: {
        clientKey: 'goodlife',
        name: 'GoodLife Costa Rica',
        accountId: newAccount.id,
        channels: ['WHATSAPP'],
        allowedAgents: ['master-router'],
        externalAccounts: [],
        status: 'ACTIVE',
      },
    });

    await prisma.externalAccount.create({
      data: {
        accountId: newAccount.id,
        channel: 'WHATSAPP',
        externalId: '60925012724039335',
        clientKey: 'goodlife',
        name: 'GoodLife WhatsApp',
        isActive: true,
      },
    });

    console.log('✅ GoodLife recréé avec succès');
    console.log(`   Account ID: ${newAccount.id}`);
    console.log(`   User: goodlife.nexxaagents / 4qFEZPjc8f`);

    await prisma.$disconnect();
    await pool.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await prisma.$disconnect();
    await pool.end();
    throw error;
  }
}

ensureGoodLifeExists();

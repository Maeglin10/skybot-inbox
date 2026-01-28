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

async function checkAccounts() {
  const accounts = await prisma.account.findMany({
    select: { id: true, name: true },
  });

  console.log('📋 Comptes existants:\n');
  for (const account of accounts) {
    console.log(`   - ${account.name}`);

    const users = await prisma.userAccount.findMany({
      where: { accountId: account.id },
      select: { email: true, username: true },
    });

    users.forEach(u => console.log(`      → User: ${u.email} (username: ${u.username || 'N/A'})`));

    const inboxes = await prisma.inbox.findMany({
      where: { accountId: account.id },
      select: { id: true, name: true },
    });

    if (inboxes.length > 0) {
      console.log(`      → Inboxes: ${inboxes.map(i => i.name).join(', ')}`);

      for (const inbox of inboxes) {
        const convCount = await prisma.conversation.count({
          where: { inboxId: inbox.id },
        });
        if (convCount > 0) {
          console.log(`         • ${inbox.name}: ${convCount} conversations`);
        }
      }
    }
    console.log('');
  }

  await prisma.$disconnect();
  await pool.end();
}

checkAccounts();

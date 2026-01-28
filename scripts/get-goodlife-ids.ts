#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

(async () => {
  const goodlife = await prisma.account.findFirst({
    where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
  });

  if (!goodlife) {
    console.log('Account not found');
    process.exit(1);
  }

  const inbox = await prisma.inbox.findFirst({
    where: { accountId: goodlife.id },
  });

  console.log('Account ID:', goodlife.id);
  console.log('Inbox ID:', inbox?.id || 'N/A');

  await prisma.$disconnect();
  await pool.end();
})();

#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
})();

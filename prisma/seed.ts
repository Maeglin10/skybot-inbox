import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const account =
    (await prisma.account.findFirst({ where: { name: 'Demo' } })) ??
    (await prisma.account.create({ data: { name: 'Demo' } }));

  await prisma.inbox.upsert({
    where: {
      accountId_externalId: { accountId: account.id, externalId: 'demo-inbox' },
    },
    update: { name: 'Demo Inbox' },
    create: {
      name: 'Demo Inbox',
      externalId: 'demo-inbox',
      accountId: account.id,
    },
  });

  console.log('Seed OK');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

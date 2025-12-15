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

  const inbox = await prisma.inbox.upsert({
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

  await prisma.contact.upsert({
    where: { inboxId_phone: { inboxId: inbox.id, phone: '573001112233' } },
    update: { name: 'Val', accountId: account.id },
    create: {
      accountId: account.id,
      inboxId: inbox.id,
      phone: '573001112233',
      name: 'Val',
    },
  });

  console.log('Seed OK');
}

main()
  .catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Seed failed:', msg);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

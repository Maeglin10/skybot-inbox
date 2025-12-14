import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const account =
    (await prisma.account.findFirst({ where: { name: 'Demo' } })) ??
    (await prisma.account.create({ data: { name: 'Demo' } }));

  await prisma.inbox.upsert({
    where: { externalId: 'demo-inbox' },
    update: { name: 'Demo Inbox', accountId: account.id },
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
  });

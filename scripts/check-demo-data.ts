import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkData() {
  const demoAccount = await prisma.account.findFirst({ where: { isDemo: true } });

  if (!demoAccount) {
    console.log('❌ No demo account found');
    return;
  }

  const alertCount = await prisma.alert.count({ where: { accountId: demoAccount.id } });
  const leadCount = await prisma.lead.count({ where: { accountId: demoAccount.id } });
  const feedbackCount = await prisma.feedback.count({ where: { accountId: demoAccount.id } });
  const routingLogCount = await prisma.routingLog.count({ where: { clientKey: 'demo-client' } });

  console.log('\n📊 Demo Data Verification:');
  console.log(`  Account: ${demoAccount.name} (${demoAccount.id})`);
  console.log(`  Alerts: ${alertCount}`);
  console.log(`  Leads: ${leadCount}`);
  console.log(`  Feedbacks: ${feedbackCount}`);
  console.log(`  Routing Logs: ${routingLogCount}`);

  await prisma.$disconnect();
  await pool.end();
}

checkData().catch(console.error);

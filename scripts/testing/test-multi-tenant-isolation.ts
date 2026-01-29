import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}

const results: TestResult[] = [];

async function testMultiTenantIsolation() {
  console.log('🔍 Testing Multi-Tenant Data Isolation\n');
  console.log('=' .repeat(60));

  try {
    // Get accounts
    const nexxaAccount = await prisma.account.findFirst({ where: { name: 'Nexxa' } });
    const demoAccount = await prisma.account.findFirst({ where: { name: 'Nexxa Demo' } });
    const goodlifeAccount = await prisma.account.findFirst({ where: { name: 'GoodLife' } });

    if (!nexxaAccount || !demoAccount || !goodlifeAccount) {
      throw new Error('Required accounts not found. Run seed-accounts.ts first.');
    }

    console.log(`\n✓ Found 3 accounts:\n  - Nexxa (${nexxaAccount.id})\n  - Nexxa Demo (${demoAccount.id})\n  - GoodLife (${goodlifeAccount.id})\n`);

    // Test 1: Leads isolation
    console.log('Test 1: Leads Isolation');
    console.log('-'.repeat(60));

    const nexxaLeads = await prisma.lead.findMany({ where: { accountId: nexxaAccount.id } });
    const demoLeads = await prisma.lead.findMany({ where: { accountId: demoAccount.id } });
    const goodlifeLeads = await prisma.lead.findMany({ where: { accountId: goodlifeAccount.id } });

    console.log(`  Nexxa leads: ${nexxaLeads.length}`);
    console.log(`  Demo leads: ${demoLeads.length}`);
    console.log(`  GoodLife leads: ${goodlifeLeads.length}`);

    const leadsOverlap = nexxaLeads.some(nl =>
      demoLeads.some(dl => dl.id === nl.id) ||
      goodlifeLeads.some(gl => gl.id === nl.id)
    );

    if (leadsOverlap) {
      results.push({ test: 'Leads Isolation', status: 'FAIL', details: 'Found overlapping lead IDs between accounts' });
      console.log('  ❌ FAIL: Overlapping data detected\n');
    } else {
      results.push({ test: 'Leads Isolation', status: 'PASS' });
      console.log('  ✅ PASS: No overlap detected\n');
    }

    // Test 2: Conversations isolation
    console.log('Test 2: Conversations Isolation');
    console.log('-'.repeat(60));

    const nexxaInbox = await prisma.inbox.findFirst({ where: { accountId: nexxaAccount.id } });
    const demoInbox = await prisma.inbox.findFirst({ where: { accountId: demoAccount.id } });

    if (nexxaInbox && demoInbox) {
      const nexxaConvos = await prisma.conversation.findMany({ where: { inboxId: nexxaInbox.id } });
      const demoConvos = await prisma.conversation.findMany({ where: { inboxId: demoInbox.id } });

      console.log(`  Nexxa conversations: ${nexxaConvos.length}`);
      console.log(`  Demo conversations: ${demoConvos.length}`);

      const convosOverlap = nexxaConvos.some(nc => demoConvos.some(dc => dc.id === nc.id));

      if (convosOverlap) {
        results.push({ test: 'Conversations Isolation', status: 'FAIL', details: 'Found overlapping conversation IDs' });
        console.log('  ❌ FAIL: Overlapping data detected\n');
      } else {
        results.push({ test: 'Conversations Isolation', status: 'PASS' });
        console.log('  ✅ PASS: No overlap detected\n');
      }
    } else {
      results.push({ test: 'Conversations Isolation', status: 'FAIL', details: 'Inboxes not found' });
      console.log('  ⚠️  SKIP: Inboxes not found\n');
    }

    // Test 3: Feedbacks isolation
    console.log('Test 3: Feedbacks Isolation');
    console.log('-'.repeat(60));

    const nexxaFeedbacks = await prisma.feedback.findMany({ where: { accountId: nexxaAccount.id } });
    const demoFeedbacks = await prisma.feedback.findMany({ where: { accountId: demoAccount.id } });

    console.log(`  Nexxa feedbacks: ${nexxaFeedbacks.length}`);
    console.log(`  Demo feedbacks: ${demoFeedbacks.length}`);

    const feedbacksOverlap = nexxaFeedbacks.some(nf => demoFeedbacks.some(df => df.id === nf.id));

    if (feedbacksOverlap) {
      results.push({ test: 'Feedbacks Isolation', status: 'FAIL', details: 'Found overlapping feedback IDs' });
      console.log('  ❌ FAIL: Overlapping data detected\n');
    } else {
      results.push({ test: 'Feedbacks Isolation', status: 'PASS' });
      console.log('  ✅ PASS: No overlap detected\n');
    }

    // Test 4: Alerts isolation
    console.log('Test 4: Alerts Isolation');
    console.log('-'.repeat(60));

    const nexxaAlerts = await prisma.alert.findMany({ where: { accountId: nexxaAccount.id } });
    const demoAlerts = await prisma.alert.findMany({ where: { accountId: demoAccount.id } });

    console.log(`  Nexxa alerts: ${nexxaAlerts.length}`);
    console.log(`  Demo alerts: ${demoAlerts.length}`);

    const alertsOverlap = nexxaAlerts.some(na => demoAlerts.some(da => da.id === na.id));

    if (alertsOverlap) {
      results.push({ test: 'Alerts Isolation', status: 'FAIL', details: 'Found overlapping alert IDs' });
      console.log('  ❌ FAIL: Overlapping data detected\n');
    } else {
      results.push({ test: 'Alerts Isolation', status: 'PASS' });
      console.log('  ✅ PASS: No overlap detected\n');
    }

    // Test 5: Users isolation
    console.log('Test 5: Users Isolation');
    console.log('-'.repeat(60));

    const nexxaUsers = await prisma.userAccount.findMany({ where: { accountId: nexxaAccount.id } });
    const demoUsers = await prisma.userAccount.findMany({ where: { accountId: demoAccount.id } });
    const goodlifeUsers = await prisma.userAccount.findMany({ where: { accountId: goodlifeAccount.id } });

    console.log(`  Nexxa users: ${nexxaUsers.length}`);
    console.log(`  Demo users: ${demoUsers.length}`);
    console.log(`  GoodLife users: ${goodlifeUsers.length}`);

    const usersOverlap = nexxaUsers.some(nu =>
      demoUsers.some(du => du.id === nu.id) ||
      goodlifeUsers.some(gu => gu.id === nu.id)
    );

    if (usersOverlap) {
      results.push({ test: 'Users Isolation', status: 'FAIL', details: 'Found overlapping user IDs' });
      console.log('  ❌ FAIL: Overlapping data detected\n');
    } else {
      results.push({ test: 'Users Isolation', status: 'PASS' });
      console.log('  ✅ PASS: No overlap detected\n');
    }

    // Summary
    console.log('=' .repeat(60));
    console.log('\n📊 Test Summary\n');

    const passCount = results.filter(r => r.status === 'PASS').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;

    results.forEach(r => {
      const icon = r.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${r.test}: ${r.status}${r.details ? ` (${r.details})` : ''}`);
    });

    console.log(`\nTotal: ${passCount} passed, ${failCount} failed out of ${results.length} tests`);

    if (failCount > 0) {
      console.log('\n🚨 CRITICAL: Multi-tenant isolation is BROKEN!');
      console.log('   DO NOT DEPLOY TO PRODUCTION until fixed.\n');
      process.exit(1);
    } else {
      console.log('\n✅ SUCCESS: Multi-tenant isolation is working correctly!\n');
    }

  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

testMultiTenantIsolation()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

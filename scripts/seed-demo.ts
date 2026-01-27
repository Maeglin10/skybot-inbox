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

const DEMO_TENANT_SLUG = 'demo-client';

/**
 * Seed idempotent pour le tenant DEMO
 * Génère des données réalistes pour Alertas, CRM et Analytics
 */
async function seedDemo() {
  console.log('🌱 Starting DEMO tenant seed...\n');

  // 1. Ensure demo account exists
  let demoAccount = await prisma.account.findFirst({
    where: { isDemo: true },
  });

  if (!demoAccount) {
    console.log('📦 Creating demo account...');
    demoAccount = await prisma.account.create({
      data: {
        name: 'Demo Account',
        isDemo: true,
        features: {
          inbox: true,
          crm: true,
          analytics: true,
          alerts: true,
          settings: true,
        },
      },
    });
    console.log(`  ✅ Demo account created: ${demoAccount.id}`);
  } else {
    console.log(`  ✅ Demo account found: ${demoAccount.id}`);
  }

  // 2. Ensure demo client config exists
  let demoConfig = await prisma.clientConfig.findFirst({
    where: { clientKey: DEMO_TENANT_SLUG },
  });

  if (!demoConfig) {
    console.log('⚙️  Creating demo client config...');
    demoConfig = await prisma.clientConfig.create({
      data: {
        accountId: demoAccount.id,
        clientKey: DEMO_TENANT_SLUG,
        name: 'Demo Client',
        status: 'ACTIVE',
        defaultAgentKey: 'master-router',
        allowedAgents: ['master-router', 'setter', 'closer', 'crm'],
        channels: ['WHATSAPP'],
        externalAccounts: {},
      },
    });
    console.log(`  ✅ Client config created: ${demoConfig.clientKey}`);
  } else {
    console.log(`  ✅ Client config found: ${demoConfig.clientKey}`);
  }

  const accountId = demoAccount.id;

  // 3. Seed Alertas (30 alerts over 14 days)
  await seedAlertas(accountId);

  // 4. Seed CRM (60 leads)
  await seedCRM(accountId);

  // 5. Seed Analytics (90 days of routing logs)
  await seedAnalytics(accountId);

  console.log('\n✨ Demo seed completed successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`  - Tenant: ${DEMO_TENANT_SLUG}`);
  console.log(`  - Account ID: ${accountId}`);
  console.log(`  - Alerts: 30`);
  console.log(`  - Leads: 60`);
  console.log(`  - Feedbacks: 15`);
  console.log(`  - Routing Logs: 90 days`);
}

async function seedAlertas(accountId: string) {
  console.log('\n🚨 Seeding Alerts...');

  const existingCount = await prisma.alert.count({ where: { accountId } });
  if (existingCount >= 30) {
    console.log(`  ⏭️  Already have ${existingCount} alerts, skipping...`);
    return;
  }

  // Delete existing to avoid duplicates
  await prisma.alert.deleteMany({ where: { accountId } });

  const now = new Date();
  const alerts = [];

  // 12 Pending Payment alerts
  for (let i = 0; i < 12; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    alerts.push({
      accountId,
      type: 'PAYMENT',
      title: `Pending Payment - Invoice #${10000 + i}`,
      subtitle: `Customer has a pending payment of $${(Math.random() * 500 + 100).toFixed(2)}`,
      status: Math.random() > 0.7 ? 'RESOLVED' : 'OPEN',
      priority: Math.random() > 0.5 ? 'HIGH' : 'MEDIUM',
      amount: Math.random() * 500 + 100,
      currency: 'USD',
      customerName: getRandomName(),
      channel: getRandomChannel(),
      createdAt,
    });
  }

  // 10 AI Handoff alerts
  for (let i = 0; i < 10; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    alerts.push({
      accountId,
      type: 'HANDOFF',
      title: `AI Escalation Required - ${getRandomIssue()}`,
      subtitle: `Customer needs human assistance`,
      status: Math.random() > 0.6 ? 'RESOLVED' : 'OPEN',
      priority: Math.random() > 0.6 ? 'HIGH' : 'MEDIUM',
      customerName: getRandomName(),
      channel: getRandomChannel(),
      createdAt,
    });
  }

  // 8 Corporate alerts
  for (let i = 0; i < 8; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    alerts.push({
      accountId,
      type: 'CORPORATE',
      title: `Corporate Account - ${getRandomCorporateAction()}`,
      subtitle: `Enterprise client requires attention`,
      status: Math.random() > 0.5 ? 'RESOLVED' : 'OPEN',
      priority: 'HIGH',
      customerName: getRandomCompany(),
      channel: Math.random() > 0.5 ? 'EMAIL' : 'WHATSAPP',
      createdAt,
    });
  }

  for (const alert of alerts) {
    await prisma.alert.create({ data: alert as any });
  }

  console.log(`  ✅ Created 30 alerts`);
}

async function seedCRM(accountId: string) {
  console.log('\n👥 Seeding CRM...');

  const existingLeads = await prisma.lead.count({ where: { accountId } });
  if (existingLeads >= 60) {
    console.log(`  ⏭️  Already have ${existingLeads} leads, skipping...`);
  } else {
    // Delete existing to avoid duplicates
    await prisma.lead.deleteMany({ where: { accountId } });

    const now = new Date();
    const stages = {
      NEW: 20,
      CONTACTED: 15,
      QUALIFIED: 10,
      WON: 8,
      LOST: 7,
    };

    let leadCount = 0;
    for (const [status, count] of Object.entries(stages)) {
      for (let i = 0; i < count; i++) {
        const daysAgo = Math.floor(Math.random() * 90);
        const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        await prisma.lead.create({
          data: {
            accountId,
            name: getRandomName(),
            company: Math.random() > 0.3 ? getRandomCompany() : null,
            email: `${getRandomName().toLowerCase().replace(' ', '.')}@example.com`,
            phone: `+506-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
            status: status as any,
            temperature: getRandomTemperature(),
            channel: getRandomChannel().toLowerCase(),
            assignedTo: Math.random() > 0.5 ? 'Agent 1' : 'Agent 2',
            tags: getRandomTags(),
            notes: `Lead from ${getRandomSource()}. ${getRandomNote()}`,
            value: Math.random() * 50000 + 5000,
            currency: 'USD',
            createdAt,
          },
        });
        leadCount++;
      }
    }

    console.log(`  ✅ Created ${leadCount} leads`);
  }

  // Seed Feedbacks
  const existingFeedbacks = await prisma.feedback.count({ where: { accountId } });
  if (existingFeedbacks >= 15) {
    console.log(`  ⏭️  Already have ${existingFeedbacks} feedbacks, skipping...`);
  } else {
    await prisma.feedback.deleteMany({ where: { accountId } });

    const now = new Date();
    for (let i = 0; i < 15; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const rating = Math.floor(Math.random() * 5) + 1;

      await prisma.feedback.create({
        data: {
          accountId,
          customerName: getRandomName(),
          customerEmail: `${getRandomName().toLowerCase().replace(' ', '.')}@example.com`,
          type: getRandomFeedbackType() as any,
          status: Math.random() > 0.6 ? 'RESOLVED' : 'PENDING',
          rating,
          message: getRandomFeedbackMessage(rating),
          channel: getRandomChannel().toLowerCase(),
          createdAt,
        },
      });
    }

    console.log(`  ✅ Created 15 feedbacks`);
  }
}

async function seedAnalytics(accountId: string) {
  console.log('\n📊 Seeding Analytics (Routing Logs)...');

  const existingLogs = await prisma.routingLog.count({
    where: { clientKey: DEMO_TENANT_SLUG },
  });

  if (existingLogs >= 500) {
    console.log(`  ⏭️  Already have ${existingLogs} routing logs, skipping...`);
    return;
  }

  // Delete existing
  await prisma.routingLog.deleteMany({ where: { clientKey: DEMO_TENANT_SLUG } });

  const now = new Date();
  const statuses = ['RECEIVED', 'FORWARDED', 'FAILED'];
  let logCount = 0;

  // Generate 1500 events over 90 days
  for (let day = 0; day < 90; day++) {
    const logsPerDay = Math.floor(Math.random() * 20) + 10;

    for (let i = 0; i < logsPerDay; i++) {
      const createdAt = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);

      await prisma.routingLog.create({
        data: {
          accountId,
          clientKey: DEMO_TENANT_SLUG,
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          agentKey: 'master-router',
          status: statuses[Math.floor(Math.random() * statuses.length)] as any,
          channel: getRandomChannel() as any,
          latencyMs: Math.floor(Math.random() * 2000) + 100,
          createdAt,
        },
      });
      logCount++;
    }
  }

  console.log(`  ✅ Created ${logCount} routing logs over 90 days`);
}

// Helper functions
function getRandomName() {
  const first = ['Juan', 'Maria', 'Carlos', 'Ana', 'Luis', 'Sofia', 'Diego', 'Carmen', 'Miguel', 'Laura'];
  const last = ['García', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez', 'Hernandez', 'Perez', 'Sanchez', 'Ramirez', 'Torres'];
  return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`;
}

function getRandomCompany() {
  const companies = ['TechStart SA', 'Digital Solutions', 'InnovateCorp', 'GlobalTech Inc', 'SmartBusiness', 'FutureTech', 'CloudSystems', 'DataPro', 'SaaS Masters', 'Enterprise Solutions'];
  return companies[Math.floor(Math.random() * companies.length)];
}

function getRandomChannel() {
  const channels = ['WHATSAPP', 'EMAIL', 'INSTAGRAM'];
  return channels[Math.floor(Math.random() * channels.length)];
}

function getRandomTemperature() {
  const temps = ['HOT', 'WARM', 'COLD'];
  const weights = [0.2, 0.5, 0.3]; // 20% hot, 50% warm, 30% cold
  const rand = Math.random();
  if (rand < weights[0]) return 'HOT';
  if (rand < weights[0] + weights[1]) return 'WARM';
  return 'COLD';
}

function getRandomTags() {
  const allTags = ['enterprise', 'smb', 'urgent', 'follow-up', 'referral', 'inbound', 'demo-requested', 'high-value', 'price-sensitive'];
  const count = Math.floor(Math.random() * 3) + 1;
  const tags = [];
  for (let i = 0; i < count; i++) {
    tags.push(allTags[Math.floor(Math.random() * allTags.length)]);
  }
  return [...new Set(tags)]; // Remove duplicates
}

function getRandomSource() {
  const sources = ['website', 'referral', 'social media', 'email campaign', 'partner', 'cold outreach'];
  return sources[Math.floor(Math.random() * sources.length)];
}

function getRandomNote() {
  const notes = [
    'Interested in enterprise plan.',
    'Requested demo for next week.',
    'Budget approved, ready to close.',
    'Needs more information about pricing.',
    'Comparing with competitors.',
    'High potential, follow up soon.',
  ];
  return notes[Math.floor(Math.random() * notes.length)];
}

function getRandomIssue() {
  const issues = ['Complex Query', 'Technical Issue', 'Billing Question', 'Feature Request', 'Complaint', 'Custom Integration'];
  return issues[Math.floor(Math.random() * issues.length)];
}

function getRandomCorporateAction() {
  const actions = ['Contract Renewal', 'Volume Discount Request', 'Partnership Inquiry', 'SLA Review', 'Enterprise Support Request', 'Custom Integration'];
  return actions[Math.floor(Math.random() * actions.length)];
}

function getRandomFeedbackType() {
  const types = ['GENERAL', 'COMPLAINT', 'PRAISE', 'SUGGESTION'];
  return types[Math.floor(Math.random() * types.length)];
}

function getRandomFeedbackMessage(rating: number) {
  if (rating >= 4) {
    const positive = [
      'Excellent service! Very satisfied with the response time.',
      'Great platform, easy to use and very helpful.',
      'Amazing support team, solved my issue quickly.',
      'Very impressed with the quality of service.',
    ];
    return positive[Math.floor(Math.random() * positive.length)];
  } else if (rating === 3) {
    return 'Service was okay, could be improved in some areas.';
  } else {
    const negative = [
      'Response time was too slow.',
      'Had issues with the platform, needs improvement.',
      'Not satisfied with the service quality.',
      'Expected better support.',
    ];
    return negative[Math.floor(Math.random() * negative.length)];
  }
}

// Run the seed
seedDemo()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

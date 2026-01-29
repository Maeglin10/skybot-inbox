import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface CSVRecord {
  [key: string]: string;
}

function readCSV(filename: string): CSVRecord[] {
  const filePath = path.join(__dirname, '..', 'tables', filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return [];
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as CSVRecord[];

  return records;
}

function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr || dateStr === '') return undefined;

  try {
    // Try parsing "DD/M/YYYY" or "D/M/YYYY HH:MMam/pm" format
    const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1;
      const year = parseInt(dateMatch[3]);

      // Check for time component
      const timeMatch = dateStr.match(/(\d{1,2}):(\d{1,2})(am|pm)/);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const isPM = timeMatch[3] === 'pm';

        if (isPM && hours !== 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;

        return new Date(year, month, day, hours, minutes);
      }

      return new Date(year, month, day);
    }

    // Try ISO format
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch (e) {
    console.warn(`Failed to parse date: ${dateStr}`);
  }

  return undefined;
}

function parseFloatValue(val: string | undefined): number | undefined {
  if (!val || val === '') return undefined;
  const cleaned = val.replace(/[$,]/g, '');
  const num = Number(cleaned);
  return isNaN(num) ? undefined : num;
}

function parseIntValue(val: string | undefined): number | undefined {
  if (!val || val === '') return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}

function parseBoolean(val: string | undefined): boolean {
  if (!val || val === '') return false;
  return val.toLowerCase() === 'checked' || val.toLowerCase() === 'true';
}

function parseJSON(val: string | undefined): any {
  if (!val || val === '') return null;
  try {
    return JSON.parse(val);
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('🌱 Starting database seed from CSV files...\n');

  // ====================
  // 🛡️ PRODUCTION SAFETY CHECK
  // ====================
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    console.error('');
    console.error('❌❌❌ ERREUR CRITIQUE ❌❌❌');
    console.error('Le seed NE PEUT PAS s\'exécuter en PRODUCTION!');
    console.error('');
    console.error('Le seed efface toutes les données existantes et recrée des données de DEMO.');
    console.error('Cela détruirait tous les vrais comptes clients en production!');
    console.error('');
    console.error('Solutions:');
    console.error('  - Pour dev local: Utilisez NODE_ENV=development');
    console.error('  - Pour ajouter un compte: Utilisez les scripts spécifiques (setup-goodlife.ts, etc.)');
    console.error('  - Pour reset en dev: npm run db:reset');
    console.error('');
    console.error('ARRÊT DU SEED POUR PROTÉGER LA PRODUCTION');
    console.error('');
    process.exit(1);
  }

  console.log('✅ Environment: development - seed autorisé\n');

  // ====================
  // 0. CLEAN EXISTING DATA (DEV ONLY)
  // ====================
  console.log('🧹 Cleaning existing data...');
  console.log('⚠️  WARNING: This will DELETE all demo/test data!');
  console.log('   PROTECTED: GoodLife and any production accounts will be preserved\n');

  // 🛡️ FIND ALL ACCOUNTS TO PROTECT (not just GoodLife)
  const allAccounts = await prisma.account.findMany({
    select: { id: true, name: true, isDemo: true },
  });

  // Protect: GoodLife + any account marked isDemo=false
  const protectedAccountIds = allAccounts
    .filter(acc => acc.name.toLowerCase().includes('goodlife') || acc.isDemo === false)
    .map(acc => acc.id);

  const demoAccountIds = allAccounts
    .filter(acc => !acc.name.toLowerCase().includes('goodlife') && acc.isDemo === true)
    .map(acc => acc.id);

  if (protectedAccountIds.length > 0) {
    console.log(`  🛡️  PROTECTED accounts (${protectedAccountIds.length}):`);
    allAccounts
      .filter(acc => protectedAccountIds.includes(acc.id))
      .forEach(acc => console.log(`     - ${acc.name} (${acc.isDemo ? 'DEMO' : 'PRODUCTION'})`));
  }

  if (demoAccountIds.length > 0) {
    console.log(`  🗑️  Will DELETE demo accounts (${demoAccountIds.length}):`);
    allAccounts
      .filter(acc => demoAccountIds.includes(acc.id))
      .forEach(acc => console.log(`     - ${acc.name}`));
  }

  console.log('');

  // Delete messages (except GoodLife)
  await prisma.message.deleteMany({
    where: protectedAccountIds.length > 0 ? { inbox: { accountId: { notIn: protectedAccountIds } } } : {},
  });

  // Delete conversations (except GoodLife)
  await prisma.conversation.deleteMany({
    where: protectedAccountIds.length > 0 ? { accountId: { notIn: protectedAccountIds } } : {},
  });

  // Delete contacts (except GoodLife)
  await prisma.contact.deleteMany({
    where: protectedAccountIds.length > 0 ? { accountId: { notIn: protectedAccountIds } } : {},
  });

  // Delete inboxes (except GoodLife)
  await prisma.inbox.deleteMany({
    where: protectedAccountIds.length > 0 ? { accountId: { notIn: protectedAccountIds } } : {},
  });

  // Delete routing logs (except GoodLife)
  await prisma.routingLog.deleteMany({
    where: protectedAccountIds.length > 0 ? { accountId: { notIn: protectedAccountIds } } : {},
  });

  // Delete alerts (except GoodLife)
  await prisma.alert.deleteMany({
    where: protectedAccountIds.length > 0 ? { accountId: { notIn: protectedAccountIds } } : {},
  });

  // Delete feedback (except GoodLife)
  await prisma.feedback.deleteMany({
    where: protectedAccountIds.length > 0 ? { accountId: { notIn: protectedAccountIds } } : {},
  });

  // Delete leads (except GoodLife)
  await prisma.lead.deleteMany({
    where: protectedAccountIds.length > 0 ? { accountId: { notIn: protectedAccountIds } } : {},
  });

  // Delete user preferences (except protected account users)
  if (protectedAccountIds.length > 0) {
    const protectedUserIds = await prisma.userAccount.findMany({
      where: { accountId: { in: protectedAccountIds } },
      select: { id: true },
    });
    await prisma.userPreference.deleteMany({
      where: { userAccountId: { notIn: protectedUserIds.map(u => u.id) } },
    });
  } else {
    await prisma.userPreference.deleteMany();
  }

  // Delete user accounts (except GoodLife)
  await prisma.userAccount.deleteMany({
    where: protectedAccountIds.length > 0 ? { accountId: { notIn: protectedAccountIds } } : {},
  });

  // Delete client configs (except GoodLife)
  await prisma.clientConfig.deleteMany({
    where: protectedAccountIds.length > 0 ? { accountId: { notIn: protectedAccountIds } } : {},
  });

  // Delete external accounts (except GoodLife)
  await prisma.externalAccount.deleteMany({
    where: protectedAccountIds.length > 0 ? { accountId: { notIn: protectedAccountIds } } : {},
  });

  // Delete accounts (except GoodLife)
  await prisma.account.deleteMany({
    where: protectedAccountIds.length > 0 ? { id: { notIn: protectedAccountIds } } : {},
  });

  console.log(`  ✅ Cleanup complete (${protectedAccountIds.length} production accounts PRESERVED)`);

  // ====================
  // 1. READ CLIENT CONFIGS
  // ====================
  console.log('\n📖 Reading client configs from CSV...');
  const clientsConfig = readCSV('clients_config-Grid view.csv');
  const accountsMap: Map<string, string> = new Map(); // client_id -> accountId

  // ====================
  // 2. CREATE ACCOUNTS
  // ====================
  console.log('\n📁 Creating Accounts...');
  for (const config of clientsConfig) {
    if (!config.client_id || !config.client_name) continue;

    // Demo account has all features enabled
    const isDemo = config.client_name?.toLowerCase() === 'demo';
    const features = isDemo
      ? {
          inbox: true,
          crm: true,
          analytics: true,
          alerts: true,
          settings: true,
          orders: true,
        }
      : {
          inbox: true,
          crm: true,
          analytics: true,
          alerts: true,
          settings: true,
        };

    const account = await prisma.account.create({
      data: {
        name: config.client_name,
        isDemo,
        features,
      },
    });

    accountsMap.set(config.client_id, account.id);
    console.log(`  ✅ ${config.client_name} (${config.client_id})`);
  }

  // ====================
  // 3. CREATE CLIENT CONFIGS
  // ====================
  // Create a default account if none exist
  if (accountsMap.size === 0) {
    console.log('\n📦 No CSV data found, creating default demo account...');
    const demoAccount = await prisma.account.create({
      data: {
        name: 'Demo Account',
        isDemo: true,
        features: {
          inbox: true,
          crm: true,
          analytics: true,
          alerts: true,
          settings: true,
          orders: true,
        },
      },
    });

    accountsMap.set('demo-client', demoAccount.id);
    console.log(`  ✅ Demo Account created (${demoAccount.id})`);

    // Create demo client config
    await prisma.clientConfig.create({
      data: {
        accountId: demoAccount.id,
        clientKey: 'demo-client',
        name: 'Demo Client',
        status: 'ACTIVE',
        defaultAgentKey: 'master-router',
        allowedAgents: ['master-router', 'setter', 'closer', 'crm', 'orders', 'aftersale'],
        channels: ['WHATSAPP'],
        externalAccounts: {},
        n8nOverrides: undefined,
      },
    });
    console.log(`  ✅ demo-client config created`);
  }

  console.log('\n⚙️  Creating Client Configs...');
  for (const config of clientsConfig) {
    if (!config.client_id) continue;

    const accountId = accountsMap.get(config.client_id);
    if (!accountId) continue;

    const clientKey = config.client_id.toLowerCase();

    await prisma.clientConfig.create({
      data: {
        accountId,
        clientKey,
        name: config.client_name || undefined,
        status: config.status === 'active' ? 'ACTIVE' : 'SUSPENDED',
        defaultAgentKey: 'master-router',
        allowedAgents: ['master-router', 'setter', 'closer', 'crm', 'orders', 'aftersale'],
        channels: ['WHATSAPP'],
        externalAccounts: {},
        n8nOverrides: undefined,
      },
    });

    console.log(`  ✅ ${clientKey}`);
  }

  // ====================
  // 4. CREATE LEADS
  // ====================
  console.log('\n👥 Creating Leads...');
  const leadsCSV = readCSV('leads-Grid view.csv');
  let leadsCount = 0;

  for (const lead of leadsCSV) {
    if (!lead.client_id || !lead.lead_id) continue;

    const accountId = accountsMap.get(lead.client_id);
    if (!accountId) continue;

    // Skip leads with no meaningful data
    if (!lead.name && !lead.email && !lead.phone) continue;

    // Map status
    let status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'WON' = 'NEW';
    const statusLower = (lead.status || '').toLowerCase();
    if (statusLower === 'contacted') status = 'CONTACTED';
    if (statusLower === 'qualified') status = 'QUALIFIED';
    if (statusLower === 'lost') status = 'LOST';
    if (statusLower === 'won') status = 'WON';

    // Map temperature
    let temperature: 'HOT' | 'WARM' | 'COLD' = 'WARM';
    const tempLower = (lead.urgency || '').toLowerCase();
    if (tempLower === 'hot') temperature = 'HOT';
    if (tempLower === 'cold') temperature = 'COLD';

    await prisma.lead.create({
      data: {
        accountId,
        name: lead.name || lead.customer_name || 'Unknown',
        company: lead.client_details || null,
        email: lead.email || lead.customer_email || null,
        phone: lead.phone || null,
        status,
        temperature,
        channel: lead.source || lead.channel || 'whatsapp',
        assignedTo: lead.assigned_agent || null,
        tags: lead.category ? [lead.category] : [],
        notes: lead.notes || null,
        value: parseFloatValue(lead.score),
        currency: 'USD',
      },
    });

    leadsCount++;
  }

  console.log(`  ✅ ${leadsCount} leads created`);

  // Add demo leads for all temperatures
  console.log('\n🎯 Adding demo leads (HOT/WARM/COLD)...');
  const firstAccountId = Array.from(accountsMap.values())[0];
  const demoLeads = [
    // HOT leads
    {
      accountId: firstAccountId,
      name: 'Roberto Martinez',
      company: 'TechStart Solutions',
      email: 'roberto.martinez@techstart.com',
      phone: '+506-8765-4321',
      status: 'QUALIFIED',
      temperature: 'HOT',
      channel: 'whatsapp',
      assignedTo: 'Agent 1',
      tags: ['enterprise', 'urgent'],
      notes: 'Ready to close, needs final proposal',
      value: 50000.00,
      currency: 'USD',
    },
    {
      accountId: firstAccountId,
      name: 'Sofia Ramirez',
      company: 'Digital Innovators CR',
      email: 'sofia@digitalcr.com',
      phone: '+506-7654-3210',
      status: 'CONTACTED',
      temperature: 'HOT',
      channel: 'email',
      assignedTo: 'Agent 2',
      tags: ['saas', 'high-value'],
      notes: 'Very interested in premium plan',
      value: 35000.00,
      currency: 'USD',
    },
    {
      accountId: firstAccountId,
      name: 'Miguel Angel Torres',
      company: 'CloudTech SA',
      email: 'mtorres@cloudtech.cr',
      phone: '+506-6543-2109',
      status: 'NEW',
      temperature: 'HOT',
      channel: 'whatsapp',
      tags: ['enterprise', 'referral'],
      notes: 'CEO referral, schedule demo ASAP',
      value: 75000.00,
      currency: 'USD',
    },
    // WARM leads
    {
      accountId: firstAccountId,
      name: 'Ana Lucia Gonzalez',
      company: 'Marketing Plus',
      email: 'ana@marketingplus.cr',
      phone: '+506-5432-1098',
      status: 'CONTACTED',
      temperature: 'WARM',
      channel: 'instagram',
      assignedTo: 'Agent 1',
      tags: ['smb', 'marketing'],
      notes: 'Interested but needs budget approval',
      value: 12000.00,
      currency: 'USD',
    },
    {
      accountId: firstAccountId,
      name: 'Carlos Hernandez',
      company: 'E-Commerce Pro',
      email: 'carlos@ecommercepro.com',
      phone: '+506-4321-0987',
      status: 'NEW',
      temperature: 'WARM',
      channel: 'whatsapp',
      tags: ['ecommerce', 'follow-up'],
      notes: 'Downloaded whitepaper, schedule call',
      value: 18000.00,
      currency: 'USD',
    },
    {
      accountId: firstAccountId,
      name: 'Patricia Morales',
      company: 'Retail Solutions',
      email: 'patricia@retail.cr',
      phone: '+506-3210-9876',
      status: 'QUALIFIED',
      temperature: 'WARM',
      channel: 'email',
      assignedTo: 'Agent 2',
      tags: ['retail', 'demo-scheduled'],
      notes: 'Demo scheduled for next week',
      value: 22000.00,
      currency: 'USD',
    },
    // COLD leads
    {
      accountId: firstAccountId,
      name: 'Luis Fernando Vargas',
      company: 'Small Business Inc',
      email: 'luis@smallbiz.cr',
      phone: '+506-2109-8765',
      status: 'NEW',
      temperature: 'COLD',
      channel: 'email',
      tags: ['inbound', 'low-priority'],
      notes: 'Requested info, not urgent',
      value: 5000.00,
      currency: 'USD',
    },
    {
      accountId: firstAccountId,
      name: 'Isabella Rodriguez',
      company: 'Startup Ventures',
      email: 'isabella@startup.cr',
      phone: '+506-1098-7654',
      status: 'CONTACTED',
      temperature: 'COLD',
      channel: 'whatsapp',
      tags: ['startup', 'low-budget'],
      notes: 'Price-sensitive, may not convert',
      value: 3000.00,
      currency: 'USD',
    },
    {
      accountId: firstAccountId,
      name: 'Eduardo Jimenez',
      company: 'Freelance Consulting',
      email: 'eduardo@freelance.com',
      phone: '+506-9876-5432',
      status: 'NEW',
      temperature: 'COLD',
      channel: 'instagram',
      tags: ['freelancer', 'exploring'],
      notes: 'Just browsing, no immediate need',
      value: 2000.00,
      currency: 'USD',
    },
  ];

  for (const leadData of demoLeads) {
    await prisma.lead.create({ data: leadData as any });
  }

  console.log(`  ✅ Added ${demoLeads.length} demo leads (3 HOT, 3 WARM, 3 COLD)`);

  // Add demo feedbacks
  console.log('\n💬 Adding demo feedbacks...');
  const demoFeedbacks = [
    {
      accountId: firstAccountId,
      customerName: 'Maria Fernandez',
      customerEmail: 'maria@example.com',
      customerPhone: '+506-1234-5678',
      type: 'GENERAL',
      status: 'PENDING',
      rating: 5,
      message: 'Excellent service! The AI assistant was very helpful and resolved my issue quickly. Highly recommend!',
      channel: 'whatsapp',
    },
    {
      accountId: firstAccountId,
      customerName: 'Juan Carlos Perez',
      customerEmail: 'jc@example.com',
      customerPhone: '+506-2345-6789',
      type: 'COMPLAINT',
      status: 'RESOLVED',
      rating: 2,
      message: 'The response time was slow and I had to wait too long. Please improve your customer service.',
      response: 'We apologize for the delay and are working on improving our response times. Thank you for your feedback.',
      respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      respondedBy: 'Support Team',
      channel: 'email',
    },
    {
      accountId: firstAccountId,
      customerName: 'Laura Sanchez',
      customerEmail: 'laura@example.com',
      type: 'PRAISE',
      status: 'CLOSED',
      rating: 5,
      message: 'Amazing platform! Very intuitive and easy to use. The WhatsApp integration works perfectly.',
      channel: 'whatsapp',
    },
    {
      accountId: firstAccountId,
      customerName: 'Diego Rojas',
      customerEmail: 'diego@example.com',
      customerPhone: '+506-3456-7890',
      type: 'SUGGESTION',
      status: 'PENDING',
      rating: 4,
      message: 'Great service overall. Would be nice to have more customization options for automated responses.',
      channel: 'instagram',
    },
    {
      accountId: firstAccountId,
      customerName: 'Valentina Castro',
      customerEmail: 'valentina@example.com',
      type: 'GENERAL',
      status: 'RESOLVED',
      rating: 5,
      message: 'The team was super responsive and helped me set everything up. Very satisfied with the product!',
      response: 'Thank you for your kind words! We\'re glad we could help.',
      respondedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      respondedBy: 'Agent 1',
      channel: 'email',
    },
    {
      accountId: firstAccountId,
      customerName: 'Andres Gutierrez',
      customerEmail: 'andres@example.com',
      customerPhone: '+506-4567-8901',
      type: 'COMPLAINT',
      status: 'PENDING',
      rating: 3,
      message: 'Some features are confusing. Need better documentation and tutorials.',
      channel: 'whatsapp',
    },
    {
      accountId: firstAccountId,
      customerName: 'Carolina Mendez',
      customerEmail: 'carolina@example.com',
      type: 'PRAISE',
      status: 'CLOSED',
      rating: 5,
      message: 'Best customer service platform I\'ve used! The AI is incredibly smart and saves us so much time.',
      channel: 'instagram',
    },
    {
      accountId: firstAccountId,
      customerName: 'Ricardo Flores',
      customerEmail: 'ricardo@example.com',
      customerPhone: '+506-5678-9012',
      type: 'SUGGESTION',
      status: 'RESOLVED',
      rating: 4,
      message: 'Would love to see analytics dashboard improvements. More detailed metrics would be helpful.',
      response: 'Thank you for the suggestion! We\'re working on enhanced analytics features in our next release.',
      respondedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      respondedBy: 'Product Team',
      channel: 'email',
    },
  ];

  for (const feedbackData of demoFeedbacks) {
    await prisma.feedback.create({ data: feedbackData as any });
  }

  console.log(`  ✅ Added ${demoFeedbacks.length} demo feedbacks`);

  // ====================
  // 5. CREATE ALERTS
  // ====================
  console.log('\n🚨 Creating Alerts...');
  const notificationsCSV = readCSV('Notifications-Grid view.csv');
  let alertsCount = 0;

  for (const notification of notificationsCSV) {
    if (!notification.message) continue;

    // Default to first account
    const accountId = Array.from(accountsMap.values())[0];

    // Parse priority
    let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    const priorityLower = (notification.priority || '').toLowerCase();
    if (priorityLower === 'high') priority = 'HIGH';
    if (priorityLower === 'low') priority = 'LOW';

    // Parse type
    let type: 'PAYMENT' | 'HANDOFF' | 'CORPORATE' | 'SYSTEM' | 'CUSTOM' = 'CUSTOM';
    const typeLower = (notification.type || '').toLowerCase();
    if (typeLower.includes('payment')) type = 'PAYMENT';
    if (typeLower.includes('escalation') || typeLower.includes('ticket')) type = 'HANDOFF';
    if (typeLower.includes('corporate') || typeLower.includes('business') || typeLower.includes('enterprise')) type = 'CORPORATE';
    if (typeLower.includes('system')) type = 'SYSTEM';

    // Parse status
    const status: 'OPEN' | 'PENDING' | 'RESOLVED' = notification.read === 'checked' ? 'RESOLVED' : 'OPEN';

    // Extract title and subtitle
    const messageLines = notification.message.split('\n').filter(l => l.trim());
    const title = messageLines[0]?.substring(0, 100) || 'Alert';
    const subtitle = messageLines.slice(1, 3).join(' ').substring(0, 200) || undefined;

    await prisma.alert.create({
      data: {
        accountId,
        type,
        title,
        subtitle,
        status,
        priority,
        customerName: notification.leadName || null,
        createdAt: parseDate(notification.timestamp) || new Date(),
      },
    });

    alertsCount++;
  }

  console.log(`  ✅ ${alertsCount} alerts created`);

  // Add demo alerts for each type
  console.log('\n🎯 Adding demo alerts for all types...');
  const demoAccountId = Array.from(accountsMap.values())[0];

  const demoAlerts = [
    // PAYMENT alerts
    {
      accountId: firstAccountId,
      type: 'PAYMENT',
      title: 'Pending Payment - Invoice #12345',
      subtitle: 'Customer Maria García has a pending payment of $250.00',
      status: 'OPEN',
      priority: 'HIGH',
      amount: 250.00,
      currency: 'USD',
      customerName: 'Maria García',
      channel: 'WHATSAPP',
    },
    {
      accountId: firstAccountId,
      type: 'PAYMENT',
      title: 'Payment Reminder - Order #67890',
      subtitle: 'Payment due in 3 days for Carlos Mendez',
      status: 'OPEN',
      priority: 'MEDIUM',
      amount: 150.00,
      currency: 'USD',
      customerName: 'Carlos Mendez',
      channel: 'EMAIL',
    },
    // HANDOFF alerts
    {
      accountId: firstAccountId,
      type: 'HANDOFF',
      title: 'AI Escalation - Complex Query',
      subtitle: 'Customer needs human assistance with technical issue',
      status: 'OPEN',
      priority: 'HIGH',
      customerName: 'Ana Rodriguez',
      channel: 'WHATSAPP',
    },
    {
      accountId: firstAccountId,
      type: 'HANDOFF',
      title: 'Agent Transfer Required',
      subtitle: 'Customer requested to speak with a manager',
      status: 'PENDING',
      priority: 'MEDIUM',
      customerName: 'Luis Fernandez',
      channel: 'INSTAGRAM',
    },
    // CORPORATE alerts
    {
      accountId: firstAccountId,
      type: 'CORPORATE',
      title: 'Enterprise Account - Contract Renewal',
      subtitle: 'TechCorp SA needs contract review for Q2 2026',
      status: 'OPEN',
      priority: 'HIGH',
      customerName: 'TechCorp SA',
      channel: 'EMAIL',
    },
    {
      accountId: firstAccountId,
      type: 'CORPORATE',
      title: 'Corporate Client - Volume Discount Request',
      subtitle: 'GlobalSolutions Inc requesting bulk pricing',
      status: 'OPEN',
      priority: 'MEDIUM',
      customerName: 'GlobalSolutions Inc',
      channel: 'WHATSAPP',
    },
    {
      accountId: firstAccountId,
      type: 'CORPORATE',
      title: 'B2B Partnership Inquiry',
      subtitle: 'MegaCorp International interested in strategic partnership',
      status: 'PENDING',
      priority: 'HIGH',
      customerName: 'MegaCorp International',
      channel: 'EMAIL',
    },
  ];

  for (const alertData of demoAlerts) {
    await prisma.alert.create({ data: alertData as any });
  }

  console.log(`  ✅ Added ${demoAlerts.length} demo alerts`);

  // ====================
  // 6. CREATE ROUTING LOGS
  // ====================
  console.log('\n📊 Creating Routing Logs...');
  const routingLogsCSV = readCSV('routing_logs-Grid view.csv');
  let routingLogsCount = 0;
  const seenRequestIds = new Set<string>();

  for (const log of routingLogsCSV) {
    if (!log.client_id || !log.request_id) continue;

    const accountId = accountsMap.get(log.client_id);
    if (!accountId) continue;

    // Skip template rows
    if (log.user_phone?.includes('{{')) continue;

    // Skip duplicate request_ids
    if (seenRequestIds.has(log.request_id)) continue;
    seenRequestIds.add(log.request_id);

    // Map status
    let status: 'RECEIVED' | 'FORWARDED' | 'FAILED' = 'RECEIVED';
    const statusLower = (log.routing_status || '').toLowerCase();
    if (statusLower === 'success') status = 'FORWARDED';
    if (statusLower === 'failed') status = 'FAILED';

    // Map channel
    let channel: 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK' | 'EMAIL' | 'WEB' | null = null;
    const providerLower = (log.provider || '').toLowerCase();
    if (providerLower === 'whatsapp') channel = 'WHATSAPP';
    if (providerLower === 'instagram') channel = 'INSTAGRAM';
    if (providerLower === 'facebook') channel = 'FACEBOOK';
    if (providerLower === 'email') channel = 'EMAIL';
    if (providerLower === 'web') channel = 'WEB';

    await prisma.routingLog.create({
      data: {
        accountId,
        requestId: log.request_id,
        clientKey: log.client_id.toLowerCase(),
        agentKey: log.target_module || null,
        channel,
        externalAccountId: log.provider_account_id || null,
        conversationId: log.conversation_id || null,
        status,
        latencyMs: parseIntValue(log.latency) || null,
        error: log.error_logs || null,
        source: log.routing_method || null,
        createdAt: parseDate(log.timestamp) || new Date(),
      },
    });

    routingLogsCount++;
  }

  console.log(`  ✅ ${routingLogsCount} routing logs created`);

  // ====================
  // 7. CREATE USER ACCOUNTS
  // ====================
  console.log('\n👤 Creating User Accounts...');
  for (const [clientId, accountId] of accountsMap.entries()) {
    const config = clientsConfig.find(c => c.client_id === clientId);
    if (!config) continue;

    const userAccount = await prisma.userAccount.create({
      data: {
        accountId,
        username: `${clientId.toLowerCase()}-admin`,
        email: `admin@${clientId.toLowerCase()}.com`,
        name: `${config.client_name} Admin`,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // Create preferences
    await prisma.userPreference.create({
      data: {
        userAccountId: userAccount.id,
        theme: 'DEFAULT',
        language: config.language === 'fr' ? 'FR' : config.language === 'es' ? 'ES' : 'EN',
        timezone: config.timezone || 'UTC',
      },
    });

    console.log(`  ✅ ${config.client_name} admin user`);
  }

  console.log('\n✨ Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`  - Accounts: ${accountsMap.size}`);
  console.log(`  - Client Configs: ${clientsConfig.length}`);
  console.log(`  - Leads: ${leadsCount}`);
  console.log(`  - Alerts: ${alertsCount}`);
  console.log(`  - Routing Logs: ${routingLogsCount}`);
  console.log(`  - User Accounts: ${accountsMap.size}\n`);
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

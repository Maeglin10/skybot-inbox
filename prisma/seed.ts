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
  // 0. CLEAN EXISTING DATA
  // ====================
  console.log('🧹 Cleaning existing data...');
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.inbox.deleteMany();
  await prisma.routingLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.userAccount.deleteMany();
  await prisma.clientConfig.deleteMany();
  await prisma.externalAccount.deleteMany();
  await prisma.account.deleteMany();
  console.log('  ✅ Cleanup complete');

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
    let type: 'PAYMENT' | 'HANDOFF' | 'SYSTEM' | 'CUSTOM' = 'CUSTOM';
    const typeLower = (notification.type || '').toLowerCase();
    if (typeLower.includes('payment')) type = 'PAYMENT';
    if (typeLower.includes('escalation') || typeLower.includes('ticket')) type = 'HANDOFF';
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

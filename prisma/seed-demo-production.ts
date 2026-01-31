import 'dotenv/config';
import { PrismaClient, UserRole, AccountStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const prisma = new PrismaClient();

// All available modules in the system (from ROADMAP.md)
const ALL_MODULES = [
  // Core System
  'auth',
  'accounts',
  'users',
  'admin',
  'prisma',

  // Communication
  'webhooks',
  'whatsapp',
  'messages',
  'conversations',
  'contacts',
  'inboxes',

  // Infrastructure
  'common',
  'websockets',
  'debug',

  // Agents & Clients
  'agents',
  'clients',

  // Billing & Business
  'billing',

  // Channels
  'channels',
  'instagram',
  'facebook',
  'email',
  'webchat',

  // Analytics & Reporting
  'analytics',

  // Knowledge & CRM
  'knowledge',
  'crm',

  // E-commerce
  'shopify',
  'orders',

  // Integrations
  'airtable',
  'integrations',
  'zapier',
  'slack',

  // Corporate & Phone
  'corporate-numbers',

  // Alerts & Notifications
  'alerts',

  // Stories & Social
  'stories',

  // Templates & Media
  'templates',
  'media',

  // Background Jobs
  'jobs',

  // Legal & Compliance
  'legal',

  // Settings & Preferences
  'settings',
  'preferences',
  'user-preferences',

  // Data Ingestion
  'ingestion',

  // Tenant Customization
  'tenant-modules',

  // Competitive Analysis
  'competitive-analysis',
];

async function main() {
  console.log('🚀 Creating Demo account and Super Admin user for production...\n');

  // ====================
  // 1. CREATE DEMO ACCOUNT
  // ====================
  let demoAccount = await prisma.account.findFirst({
    where: { name: 'Demo' }
  });

  if (!demoAccount) {
    demoAccount = await prisma.account.create({
      data: {
        name: 'Demo',
        isDemo: true,
        status: 'ACTIVE',
        tier: 'ENTERPRISE', // Give Demo account full access
        features: {
          inbox: true,
          crm: true,
          analytics: true,
          channels: true,
          calendar: true,
          alerts: true,
          settings: true,
          orders: true,
          billing: true,
          knowledge: true,
          integrations: true,
          media: true,
          templates: true,
          reports: true,
          automation: true,
        }
      }
    });
    console.log('✅ Created Demo account');
  } else {
    console.log('ℹ️  Demo account already exists');

    // Update features to ensure all are enabled
    await prisma.account.update({
      where: { id: demoAccount.id },
      data: {
        features: {
          inbox: true,
          crm: true,
          analytics: true,
          channels: true,
          calendar: true,
          alerts: true,
          settings: true,
          orders: true,
          billing: true,
          knowledge: true,
          integrations: true,
          media: true,
          templates: true,
          reports: true,
          automation: true,
        },
        tier: 'ENTERPRISE',
        status: 'ACTIVE',
      }
    });
    console.log('✅ Updated Demo account features');
  }

  // ====================
  // 2. ENABLE ALL MODULES
  // ====================
  console.log('\n📦 Enabling all modules for Demo account...\n');

  let modulesCreated = 0;
  let modulesExisting = 0;

  for (const moduleKey of ALL_MODULES) {
    const existing = await prisma.tenantModule.findUnique({
      where: {
        tenantId_moduleKey: {
          tenantId: demoAccount.id,
          moduleKey
        }
      }
    });

    if (!existing) {
      await prisma.tenantModule.create({
        data: {
          tenantId: demoAccount.id,
          moduleKey,
          enabled: true,
          limits: undefined, // No limits for Demo account
        }
      });
      modulesCreated++;
      console.log(`  ✅ Enabled: ${moduleKey}`);
    } else {
      // Ensure existing module is enabled
      if (!existing.enabled) {
        await prisma.tenantModule.update({
          where: { id: existing.id },
          data: { enabled: true }
        });
        console.log(`  🔄 Re-enabled: ${moduleKey}`);
      } else {
        modulesExisting++;
      }
    }
  }

  console.log(`\n📊 Modules: ${modulesCreated} created, ${modulesExisting} already enabled`);

  // ====================
  // 3. CREATE SUPER ADMIN USER (VALENTIN)
  // ====================
  console.log('\n👤 Creating Super Admin user for Valentin...\n');

  const valentinUsername = 'valentin';
  const valentinEmail = 'valentin.milliand@nexxa.global';
  const valentinPassword = process.env.SEED_VALENTIN_PASSWORD || 'ChangeMeInProduction123!';

  let valentinUser = await prisma.userAccount.findFirst({
    where: {
      accountId: demoAccount.id,
      OR: [
        { username: valentinUsername },
        { email: valentinEmail }
      ]
    }
  });

  if (!valentinUser) {
    const passwordHash = await bcrypt.hash(valentinPassword, 10);

    valentinUser = await prisma.userAccount.create({
      data: {
        accountId: demoAccount.id,
        username: valentinUsername,
        email: valentinEmail,
        passwordHash,
        name: 'Valentin Milliand',
        role: UserRole.SUPER_ADMIN, // Maximum privileges
        status: AccountStatus.ACTIVE
      }
    });

    // Create user preferences
    await prisma.userPreference.create({
      data: {
        userAccountId: valentinUser.id,
        theme: 'DARK',
        language: 'FR',
        timezone: 'Europe/Paris'
      }
    });

    console.log('✅ Created Super Admin user: valentin');
  } else {
    console.log('ℹ️  User valentin already exists');

    // Update role to SUPER_ADMIN if not already
    if (valentinUser.role !== UserRole.SUPER_ADMIN) {
      await prisma.userAccount.update({
        where: { id: valentinUser.id },
        data: { role: UserRole.SUPER_ADMIN, status: AccountStatus.ACTIVE }
      });
      console.log('✅ Updated user role to SUPER_ADMIN');
    }
  }

  // ====================
  // 4. CREATE DEMO CLIENT CONFIG
  // ====================
  console.log('\n⚙️  Creating Demo client configuration...\n');

  const demoClientConfig = await prisma.clientConfig.findFirst({
    where: {
      accountId: demoAccount.id,
      clientKey: 'demo'
    }
  });

  if (!demoClientConfig) {
    await prisma.clientConfig.create({
      data: {
        accountId: demoAccount.id,
        clientKey: 'demo',
        name: 'Demo Client',
        status: 'ACTIVE',
        defaultAgentKey: 'master-router',
        allowedAgents: ['master-router', 'setter', 'closer', 'crm', 'orders', 'aftersale'],
        channels: ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'EMAIL', 'WEB'],
        externalAccounts: {},
        n8nOverrides: undefined,
      }
    });
    console.log('✅ Created demo client config');
  } else {
    console.log('ℹ️  Demo client config already exists');
  }

  // ====================
  // 5. SUMMARY
  // ====================
  console.log('\n' + '='.repeat(50));
  console.log('✅ DEMO ACCOUNT SETUP COMPLETE!');
  console.log('='.repeat(50));
  console.log('\n📊 Summary:');
  console.log(`  - Account: Demo (${demoAccount.id})`);
  console.log(`  - Modules enabled: ${ALL_MODULES.length}`);
  console.log(`  - Super Admin: ${valentinUsername}`);
  console.log(`  - Client Config: demo`);

  console.log('\n🔑 Login Credentials:');
  console.log('  Username: valentin');
  console.log(`  Email: ${valentinEmail}`);
  console.log(`  Password: ${valentinPassword === process.env.SEED_VALENTIN_PASSWORD ? '[From .env SEED_VALENTIN_PASSWORD]' : valentinPassword}`);
  console.log('  Role: SUPER_ADMIN');

  console.log('\n⚠️  IMPORTANT:');
  console.log('  - Save these credentials securely!');
  console.log('  - The Demo account has ALL modules enabled');
  console.log('  - You can now login and start using the system');
  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Error creating Demo account:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

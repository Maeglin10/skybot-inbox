import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// All available modules
const ALL_MODULES = [
  'auth', 'accounts', 'users', 'admin', 'prisma',
  'webhooks', 'whatsapp', 'messages', 'conversations', 'contacts', 'inboxes',
  'common', 'websockets', 'debug',
  'agents', 'clients', 'billing', 'channels', 'instagram', 'facebook', 'email', 'webchat',
  'analytics', 'knowledge', 'crm', 'shopify', 'orders',
  'airtable', 'integrations', 'zapier', 'slack',
  'corporate-numbers', 'alerts', 'stories', 'templates', 'media', 'jobs',
  'legal', 'settings', 'preferences', 'user-preferences',
  'ingestion', 'tenant-modules', 'competitive-analysis',
];

async function main() {
  console.log('🚀 Setting up Demo account...\n');

  try {
    // 1. Find or create Demo account
    let demoAccount = await prisma.account.findFirst({
      where: { name: 'Demo' }
    });

    if (!demoAccount) {
      console.log('Creating Demo account...');
      demoAccount = await prisma.account.create({
        data: {
          name: 'Demo',
          isDemo: true,
          status: 'ACTIVE',
          tier: 'ENTERPRISE',
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
      console.log('✅ Demo account created');
    } else {
      console.log('✅ Demo account found');
    }

    // 2. Enable all modules
    console.log('\n📦 Enabling modules...');
    let created = 0;
    for (const moduleKey of ALL_MODULES) {
      try {
        await prisma.tenantModule.upsert({
          where: {
            tenantId_moduleKey: {
              tenantId: demoAccount.id,
              moduleKey
            }
          },
          update: { enabled: true },
          create: {
            tenantId: demoAccount.id,
            moduleKey,
            enabled: true,
          }
        });
        created++;
      } catch (e) {
        console.error(`  ⚠️  Failed to enable ${moduleKey}:`, e);
      }
    }
    console.log(`✅ ${created} modules enabled`);

    // 3. Create super admin user
    console.log('\n👤 Creating super admin user...');
    const username = 'valentin';
    const email = 'valentin.milliand@nexxa.global';
    const password = process.env.SEED_VALENTIN_PASSWORD || 'ChangeMeInProduction123!';

    try {
      // Check if user exists
      const existing = await prisma.userAccount.findFirst({
        where: {
          accountId: demoAccount.id,
          OR: [{ username }, { email }]
        }
      });

      if (existing) {
        console.log('✅ User already exists');
        // Update to SUPER_ADMIN if not already
        await prisma.userAccount.update({
          where: { id: existing.id },
          data: {
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            name: 'Valentin Milliand'
          }
        });
        console.log('✅ Updated user role to SUPER_ADMIN');
      } else {
        // Create new user
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.userAccount.create({
          data: {
            accountId: demoAccount.id,
            username,
            email,
            passwordHash,
            name: 'Valentin Milliand',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE'
          }
        });
        console.log('✅ Super admin user created');

        // Create preferences
        try {
          await prisma.userPreference.create({
            data: {
              userAccountId: user.id,
              theme: 'DARK',
              language: 'FR',
              timezone: 'Europe/Paris'
            }
          });
          console.log('✅ User preferences created');
        } catch (e) {
          console.log('⚠️  Could not create preferences (table may not exist)');
        }
      }
    } catch (userError: any) {
      console.error('❌ User creation failed:', userError.message);
      console.log('\n⚠️  This might be due to missing database columns.');
      console.log('   The Demo account and modules are ready.');
      console.log('   You can create the user manually or run migrations first.');
    }

    // 4. Create client config
    console.log('\n⚙️  Setting up client config...');
    try {
      await prisma.clientConfig.upsert({
        where: {
          accountId_clientKey: {
            accountId: demoAccount.id,
            clientKey: 'demo'
          }
        },
        update: {
          status: 'ACTIVE',
          channels: ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'EMAIL', 'WEB'],
        },
        create: {
          accountId: demoAccount.id,
          clientKey: 'demo',
          name: 'Demo Client',
          status: 'ACTIVE',
          defaultAgentKey: 'master-router',
          allowedAgents: ['master-router', 'setter', 'closer', 'crm', 'orders', 'aftersale'],
          channels: ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'EMAIL', 'WEB'],
          externalAccounts: {},
        }
      });
      console.log('✅ Client config ready');
    } catch (e) {
      console.log('⚠️  Client config setup skipped');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ DEMO ACCOUNT SETUP COMPLETE!');
    console.log('='.repeat(50));
    console.log(`\nAccount ID: ${demoAccount.id}`);
    console.log(`Modules: ${created} enabled`);
    console.log(`\nLogin credentials:`);
    console.log(`  Username: ${username}`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password === process.env.SEED_VALENTIN_PASSWORD ? '[From SEED_VALENTIN_PASSWORD env var]' : password}`);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const prisma = new PrismaClient();

// GoodLife WhatsApp Configuration
const GOODLIFE_WHATSAPP_CONFIG = {
  phoneNumberId: '966520989876579',
  businessNumber: '50660213707',
  displayName: 'Goodlife Costa Rica',
  accountName: 'Goodlife Costa Rica', // Exact name in database
  clientKey: 'goodlife',
};

async function main() {
  console.log('🚀 Setting up GoodLife WhatsApp integration...\n');

  // 1. Find or create GoodLife account
  let account = await prisma.account.findFirst({
    where: {
      OR: [
        { name: GOODLIFE_WHATSAPP_CONFIG.accountName },
        { name: { contains: 'GoodLife', mode: 'insensitive' } },
        { name: { contains: 'Goodlife', mode: 'insensitive' } },
      ],
    },
  });

  if (!account) {
    console.log('❌ GoodLife account not found. Creating it...');
    account = await prisma.account.create({
      data: {
        name: GOODLIFE_WHATSAPP_CONFIG.accountName,
        isDemo: false,
        tier: 'PRO',
        status: 'ACTIVE',
        features: {
          inbox: true,
          crm: true,
          analytics: true,
          channels: true,
          calendar: true,
          alerts: true,
        },
      },
    });
    console.log(`✅ Created GoodLife account: ${account.id}\n`);
  } else {
    console.log(`✅ Found GoodLife account: ${account.name} (${account.id})\n`);
  }

  // 2. Create or update ExternalAccount (phone_number_id mapping)
  let externalAccount = await prisma.externalAccount.findFirst({
    where: {
      accountId: account.id,
      channel: 'WHATSAPP',
      externalId: GOODLIFE_WHATSAPP_CONFIG.phoneNumberId,
    },
  });

  if (!externalAccount) {
    externalAccount = await prisma.externalAccount.create({
      data: {
        accountId: account.id,
        channel: 'WHATSAPP',
        externalId: GOODLIFE_WHATSAPP_CONFIG.phoneNumberId,
        clientKey: GOODLIFE_WHATSAPP_CONFIG.clientKey,
        name: `${GOODLIFE_WHATSAPP_CONFIG.displayName} WhatsApp`,
        isActive: true,
      },
    });
    console.log(
      `✅ Created ExternalAccount for phone_number_id: ${GOODLIFE_WHATSAPP_CONFIG.phoneNumberId}\n`,
    );
  } else {
    // Update to ensure it's active and has correct clientKey
    externalAccount = await prisma.externalAccount.update({
      where: { id: externalAccount.id },
      data: {
        clientKey: GOODLIFE_WHATSAPP_CONFIG.clientKey,
        name: `${GOODLIFE_WHATSAPP_CONFIG.displayName} WhatsApp`,
        isActive: true,
      },
    });
    console.log(
      `✅ Updated ExternalAccount for phone_number_id: ${GOODLIFE_WHATSAPP_CONFIG.phoneNumberId}\n`,
    );
  }

  // 3. Create or update ClientConfig (N8N routing configuration)
  let clientConfig = await prisma.clientConfig.findUnique({
    where: {
      accountId_clientKey: {
        accountId: account.id,
        clientKey: GOODLIFE_WHATSAPP_CONFIG.clientKey,
      },
    },
  });

  if (!clientConfig) {
    clientConfig = await prisma.clientConfig.create({
      data: {
        accountId: account.id,
        clientKey: GOODLIFE_WHATSAPP_CONFIG.clientKey,
        status: 'ACTIVE',
        name: GOODLIFE_WHATSAPP_CONFIG.displayName,
        defaultAgentKey: 'master-router',
        allowedAgents: [
          'master-router',
          'setter',
          'closer',
          'crm',
          'orders',
          'aftersale',
        ],
        channels: {
          whatsapp: {
            enabled: true,
            phoneNumberId: GOODLIFE_WHATSAPP_CONFIG.phoneNumberId,
            businessNumber: GOODLIFE_WHATSAPP_CONFIG.businessNumber,
          },
        },
        externalAccounts: {
          whatsapp: GOODLIFE_WHATSAPP_CONFIG.phoneNumberId,
        },
        // n8nOverrides omitted - uses default N8N configuration from .env
      },
    });
    console.log(
      `✅ Created ClientConfig with key: ${GOODLIFE_WHATSAPP_CONFIG.clientKey}\n`,
    );
  } else {
    // Update to ensure correct configuration
    clientConfig = await prisma.clientConfig.update({
      where: { id: clientConfig.id },
      data: {
        status: 'ACTIVE',
        name: GOODLIFE_WHATSAPP_CONFIG.displayName,
        defaultAgentKey: 'master-router',
        allowedAgents: [
          'master-router',
          'setter',
          'closer',
          'crm',
          'orders',
          'aftersale',
        ],
        channels: {
          whatsapp: {
            enabled: true,
            phoneNumberId: GOODLIFE_WHATSAPP_CONFIG.phoneNumberId,
            businessNumber: GOODLIFE_WHATSAPP_CONFIG.businessNumber,
          },
        },
        externalAccounts: {
          whatsapp: GOODLIFE_WHATSAPP_CONFIG.phoneNumberId,
        },
      },
    });
    console.log(
      `✅ Updated ClientConfig with key: ${GOODLIFE_WHATSAPP_CONFIG.clientKey}\n`,
    );
  }

  // 4. Create or update Inbox
  let inbox = await prisma.inbox.findFirst({
    where: {
      accountId: account.id,
      externalId: GOODLIFE_WHATSAPP_CONFIG.phoneNumberId,
      channel: 'WHATSAPP',
    },
  });

  if (!inbox) {
    inbox = await prisma.inbox.create({
      data: {
        accountId: account.id,
        externalId: GOODLIFE_WHATSAPP_CONFIG.phoneNumberId,
        name: `WhatsApp ${GOODLIFE_WHATSAPP_CONFIG.displayName}`,
        channel: 'WHATSAPP',
      },
    });
    console.log(`✅ Created Inbox for WhatsApp\n`);
  } else {
    inbox = await prisma.inbox.update({
      where: { id: inbox.id },
      data: {
        name: `WhatsApp ${GOODLIFE_WHATSAPP_CONFIG.displayName}`,
      },
    });
    console.log(`✅ Updated Inbox for WhatsApp\n`);
  }

  console.log('═══════════════════════════════════════════════');
  console.log('✅ GoodLife WhatsApp Integration Setup Complete!');
  console.log('═══════════════════════════════════════════════\n');
  console.log('📋 Configuration Summary:');
  console.log(`   Account: ${account.name} (${account.id})`);
  console.log(
    `   Phone Number ID: ${GOODLIFE_WHATSAPP_CONFIG.phoneNumberId}`,
  );
  console.log(
    `   Business Number: +${GOODLIFE_WHATSAPP_CONFIG.businessNumber}`,
  );
  console.log(`   Client Key: ${GOODLIFE_WHATSAPP_CONFIG.clientKey}`);
  console.log(`   Default Agent: master-router`);
  console.log(`   ExternalAccount ID: ${externalAccount.id}`);
  console.log(`   ClientConfig ID: ${clientConfig.id}`);
  console.log(`   Inbox ID: ${inbox.id}`);
  console.log('\n📱 WhatsApp webhook is ready to receive messages!');
  console.log('🤖 N8N routing is configured with master-router');
  console.log('\n⚠️  Make sure your .env has:');
  console.log(
    '   - WHATSAPP_PHONE_NUMBER_ID=966520989876579',
  );
  console.log('   - WHATSAPP_BUSINESS_NUMBER=50660213707');
  console.log(
    '   - N8N_MASTER_ROUTER_URL=https://vmilliand.app.n8n.cloud/webhook/whatsapp-master-webhook',
  );
}

main()
  .catch((e) => {
    console.error('❌ Error setting up GoodLife WhatsApp:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

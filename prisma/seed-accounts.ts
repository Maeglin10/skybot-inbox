import 'dotenv/config';
import { PrismaClient, UserRole, AccountStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Secure credentials for new accounts
const ACCOUNTS_CREDENTIALS = {
  valentin: {
    email: 'valentin.milliand@nexxa',
    password: '4gs75062a6rOnOKy3j09ireEPWAB5Td',
    name: 'Valentin Milliand',
    role: UserRole.ADMIN,
    accountName: 'Nexxa'
  },
  nexxaAdmin: {
    email: 'Nexxa@admin',
    password: '2J748mbMBcOrJv41K5FmAIaOlMGMw3H',
    name: 'Nexxa Admin',
    role: UserRole.ADMIN,
    accountName: 'Nexxa'
  },
  nexxaDemo: {
    email: 'Nexxa@demo',
    password: 'OfIPAbn9j6Gy0x9VqOW0KY06UqzPo7',
    name: 'Nexxa Demo Account',
    role: UserRole.ADMIN,
    accountName: 'Nexxa Demo'
  },
  goodlife: {
    email: 'goodlife.agents',
    password: '4qFEZPjc8f',
    name: 'GoodLife Agents',
    role: UserRole.USER,
    accountName: 'GoodLife'
  }
};

async function main() {
  console.log('🚀 Creating production accounts...\n');

  // Create Nexxa Account (for valentin + nexxa admin)
  let nexxaAccount = await prisma.account.findFirst({
    where: { name: 'Nexxa' }
  });

  if (!nexxaAccount) {
    nexxaAccount = await prisma.account.create({
      data: {
        name: 'Nexxa',
        isDemo: false,
        features: {
          inbox: true,
          crm: true,
          analytics: true,
          channels: true,
          calendar: true,
          alerts: true
        }
      }
    });
    console.log('✅ Created Nexxa account');
  } else {
    console.log('ℹ️  Nexxa account already exists');
  }

  // Create Nexxa Demo Account
  let nexxaDemoAccount = await prisma.account.findFirst({
    where: { name: 'Nexxa Demo' }
  });

  if (!nexxaDemoAccount) {
    nexxaDemoAccount = await prisma.account.create({
      data: {
        name: 'Nexxa Demo',
        isDemo: true,
        features: {
          inbox: true,
          crm: true,
          analytics: true,
          channels: true,
          calendar: true,
          alerts: true
        }
      }
    });
    console.log('✅ Created Nexxa Demo account');
  } else {
    console.log('ℹ️  Nexxa Demo account already exists');
  }

  // Create GoodLife Account
  let goodlifeAccount = await prisma.account.findFirst({
    where: { name: 'GoodLife' }
  });

  if (!goodlifeAccount) {
    goodlifeAccount = await prisma.account.create({
      data: {
        name: 'GoodLife',
        isDemo: false,
        features: {
          inbox: true,
          crm: true,
          analytics: true,
          channels: true,
          calendar: true,
          alerts: true
        }
      }
    });
    console.log('✅ Created GoodLife account');
  } else {
    console.log('ℹ️  GoodLife account already exists');
  }

  console.log('\n👤 Creating user accounts...\n');

  // Create Valentin account
  await createUserAccount(
    ACCOUNTS_CREDENTIALS.valentin,
    nexxaAccount.id
  );

  // Create Nexxa Admin account
  await createUserAccount(
    ACCOUNTS_CREDENTIALS.nexxaAdmin,
    nexxaAccount.id
  );

  // Create Nexxa Demo account
  await createUserAccount(
    ACCOUNTS_CREDENTIALS.nexxaDemo,
    nexxaDemoAccount.id
  );

  // Create GoodLife account
  await createUserAccount(
    ACCOUNTS_CREDENTIALS.goodlife,
    goodlifeAccount.id
  );

  console.log('\n✅ All accounts created successfully!\n');
  console.log('📝 Login Credentials (SAVE THESE):');
  console.log('=====================================');

  for (const [key, creds] of Object.entries(ACCOUNTS_CREDENTIALS)) {
    console.log(`\n${creds.name}:`);
    console.log(`  Email: ${creds.email}`);
    console.log(`  Password: ${creds.password}`);
    console.log(`  Role: ${creds.role}`);
  }

  console.log('\n=====================================');
  console.log('⚠️  IMPORTANT: Store these credentials securely!');
}

async function createUserAccount(
  credentials: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
  },
  accountId: string
) {
  const existing = await prisma.userAccount.findFirst({
    where: { email: credentials.email }
  });

  if (existing) {
    console.log(`ℹ️  User ${credentials.email} already exists`);
    return existing;
  }

  const passwordHash = await bcrypt.hash(credentials.password, 10);

  const user = await prisma.userAccount.create({
    data: {
      accountId,
      email: credentials.email,
      passwordHash,
      name: credentials.name,
      role: credentials.role,
      status: AccountStatus.ACTIVE
    }
  });

  // Create user preferences
  await prisma.userPreference.create({
    data: {
      userAccountId: user.id,
      theme: 'DEFAULT',
      language: 'FR',
      timezone: 'Europe/Paris'
    }
  });

  console.log(`✅ Created user: ${credentials.email} (${credentials.role})`);
  return user;
}

main()
  .catch((e) => {
    console.error('❌ Error creating accounts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

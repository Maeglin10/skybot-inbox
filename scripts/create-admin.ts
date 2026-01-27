import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔐 Creating admin user...\n');

    // Create Account (tenant)
    const account = await prisma.account.upsert({
      where: { id: 'acc_demo' },
      update: {},
      create: {
        id: 'acc_demo',
        name: 'Demo Account',
        tier: "PRO",
        status: 'ACTIVE',
      },
    });

    console.log(`✅ Account created: ${account.name} (${account.id})`);

    // Hash password
    const passwordHash = await bcrypt.hash('Admin123!', 10);

    // Create Admin User
    const adminUser = await prisma.userAccount.upsert({
      where: {
        accountId_username: {
          accountId: account.id,
          username: 'admin',
        },
      },
      update: {
        passwordHash,
        email: 'admin@demo.com',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      create: {
        accountId: account.id,
        username: 'admin',
        email: 'admin@demo.com',
        passwordHash,
        name: 'Demo Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    console.log(`✅ Admin user created: ${adminUser.username} / ${adminUser.email}`);

    // Create User Preferences
    await prisma.userPreference.upsert({
      where: { userAccountId: adminUser.id },
      update: {},
      create: {
        userAccountId: adminUser.id,
        theme: 'DEFAULT',
        language: 'ES',
        timezone: 'UTC',
      },
    });

    console.log(`✅ User preferences created`);

    // Enable all modules for the account
    const modules = [
      'INBOX',
      'CRM',
      'ANALYTICS',
      'AGENTS',
      'CALENDAR',
      'SETTINGS',
    ];

    for (const moduleKey of modules) {
      await prisma.tenantModule.upsert({
        where: {
          tenantId_moduleKey: {
            tenantId: account.id,
            moduleKey,
          },
        },
        update: {
          enabled: true,
        },
        create: {
          tenantId: account.id,
          moduleKey,
          enabled: true,
          limits: {}, // JSON object for limits
        },
      });
    }

    console.log(`✅ All modules enabled\n`);

    console.log('📝 Login credentials:');
    console.log('   Username: admin');
    console.log('   Email: admin@demo.com');
    console.log('   Password: Admin123!');
    console.log('\n🎉 Admin user created successfully!');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

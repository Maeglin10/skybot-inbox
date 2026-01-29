#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function ensureGoodLifeExists() {
  console.log('🔍 Vérification rapide GoodLife...');

  try {
    // Vérifier si GoodLife existe
    let account = await prisma.account.findFirst({
      where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
    });

    if (account) {
      console.log('✅ GoodLife account existe - vérification user...');

      // Vérifier si l'utilisateur existe
      const user = await prisma.userAccount.findFirst({
        where: {
          accountId: account.id,
          username: 'goodlife.nexxaagents'
        }
      });

      if (user && user.passwordHash) {
        console.log('✅ User goodlife.nexxaagents existe avec password');
        await prisma.$disconnect();
        await pool.end();
        return;
      }

      if (user && !user.passwordHash) {
        console.log('⚠️  User existe mais sans password - mise à jour...');
        const passwordHash = await bcrypt.hash('4qFEZPjc8f', 10);
        await prisma.userAccount.update({
          where: { id: user.id },
          data: { passwordHash }
        });
        console.log('✅ Password ajouté');
        await prisma.$disconnect();
        await pool.end();
        return;
      }

      if (!user) {
        console.log('⚠️  User manquant - création...');
        const passwordHash = await bcrypt.hash('4qFEZPjc8f', 10);
        const newUser = await prisma.userAccount.create({
          data: {
            accountId: account.id,
            username: 'goodlife.nexxaagents',
            email: 'ventas@goodlifecr.com',
            passwordHash,
            name: 'GoodLife Agent',
            role: 'USER',
            status: 'ACTIVE',
          },
        });

        // Ensure preferences exist
        const existingPrefs = await prisma.userPreference.findUnique({
          where: { userAccountId: newUser.id }
        });

        if (!existingPrefs) {
          await prisma.userPreference.create({
            data: {
              userAccountId: newUser.id,
              theme: 'DEFAULT',
              language: 'ES',
              timezone: 'UTC',
            },
          });
        }

        console.log('✅ User créé avec succès');
        await prisma.$disconnect();
        await pool.end();
        return;
      }
    }

    // GoodLife n'existe pas - le recréer automatiquement
    console.log('⚠️  GoodLife manquant - recréation automatique...');

    account = await prisma.account.create({
      data: {
        name: 'Goodlife Costa Rica',
        status: 'ACTIVE',
      },
    });

    const passwordHash = await bcrypt.hash('4qFEZPjc8f', 10);
    const user = await prisma.userAccount.create({
      data: {
        accountId: account.id,
        username: 'goodlife.nexxaagents',
        email: 'ventas@goodlifecr.com',
        passwordHash,
        name: 'GoodLife Agent',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    await prisma.userPreference.create({
      data: {
        userAccountId: user.id,
        theme: 'DEFAULT',
        language: 'ES',
        timezone: 'UTC',
      },
    });

    const inbox = await prisma.inbox.create({
      data: {
        accountId: account.id,
        externalId: '966520989876579',
        name: 'WhatsApp GoodLife',
        channel: 'WHATSAPP',
      },
    });

    await prisma.clientConfig.create({
      data: {
        clientKey: 'goodlife',
        name: 'GoodLife Costa Rica',
        accountId: account.id,
        channels: ['WHATSAPP'],
        allowedAgents: ['master-router'],
        externalAccounts: [],
        status: 'ACTIVE',
      },
    });

    await prisma.externalAccount.create({
      data: {
        accountId: account.id,
        channel: 'WHATSAPP',
        externalId: '966520989876579',
        clientKey: 'goodlife',
        name: 'GoodLife WhatsApp',
        isActive: true,
      },
    });

    // Recréer les 6 conversations de test
    const corporateContacts = [
      { name: 'Ana García - Ventas', phone: '+50688881111' },
      { name: 'Carlos Rodríguez - Administración', phone: '+50688882222' },
      { name: 'María López - Servicio al Cliente', phone: '+50688883333' },
      { name: 'José Hernández - Gerente', phone: '+50688884444' },
      { name: 'Laura Martínez - Recursos Humanos', phone: '+50688885555' },
    ];

    for (const contactData of corporateContacts) {
      const contact = await prisma.contact.create({
        data: {
          accountId: account.id,
          inboxId: inbox.id,
          phone: contactData.phone,
          name: contactData.name,
          isCorporate: true,
        },
      });

      const conversation = await prisma.conversation.create({
        data: {
          inboxId: inbox.id,
          contactId: contact.id,
          channel: 'WHATSAPP',
          status: 'OPEN',
          lastActivityAt: new Date(),
        },
      });

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          channel: 'WHATSAPP',
          direction: 'IN',
          from: contact.phone,
          to: '+50660213707',
          text: `Hola! Soy ${contactData.name.split(' - ')[0]} del equipo GoodLife.`,
          timestamp: new Date(),
        },
      });
    }

    // Contact de test
    const testContact = await prisma.contact.create({
      data: {
        accountId: account.id,
        inboxId: inbox.id,
        phone: '+50612345678',
        name: 'Cliente Test',
      },
    });

    const testConv = await prisma.conversation.create({
      data: {
        inboxId: inbox.id,
        contactId: testContact.id,
        channel: 'WHATSAPP',
        status: 'OPEN',
        lastActivityAt: new Date(),
      },
    });

    await prisma.message.create({
      data: {
        conversationId: testConv.id,
        channel: 'WHATSAPP',
        direction: 'IN',
        from: '+50612345678',
        to: '+50660213707',
        text: '🧪 Mensaje de prueba - SkyBot Inbox funcionando correctamente! ✅',
        timestamp: new Date(),
      },
    });

    console.log('✅ GoodLife recréé avec succès (avec 6 conversations)');
    console.log(`   Account ID: ${account.id}`);
    console.log(`   User: goodlife.nexxaagents / 4qFEZPjc8f`);
    console.log(`   Conversations: 6 (5 corporatives + 1 test)`);

    await prisma.$disconnect();
    await pool.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await prisma.$disconnect();
    await pool.end();
    throw error;
  }
}

ensureGoodLifeExists();

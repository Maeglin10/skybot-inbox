#!/usr/bin/env ts-node
/**
 * Script de synchronisation de la DB Production
 *
 * Ce script s'assure que toutes les données nécessaires existent en production:
 * - Account GoodLife
 * - User goodlife.nexxaagents
 * - ClientConfig
 * - Inbox WhatsApp
 * - ExternalAccount
 * - Corporate Contacts (16)
 *
 * Usage:
 *   DATABASE_URL=<render_db_url> npx tsx scripts/sync-production-db.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function syncProductionDB() {
  console.log('\n🔄 SYNCHRONISATION DB PRODUCTION\n');
  console.log('='.repeat(60));

  try {
    // 1. VÉRIFIER/CRÉER ACCOUNT GOODLIFE
    console.log('\n📊 1. Account GoodLife');
    console.log('-'.repeat(60));

    let account = await prisma.account.findFirst({
      where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
    });

    if (!account) {
      console.log('⚠️  Account GoodLife n\'existe pas - Création...');
      account = await prisma.account.create({
        data: {
          name: 'Goodlife Costa Rica',
          domain: 'goodlifecr.com',
          status: 'ACTIVE',
        },
      });
      console.log(`✅ Account créé: ${account.id}`);
    } else {
      console.log(`✅ Account existe: ${account.name} (${account.id})`);
    }

    const accountId = account.id;

    // 2. VÉRIFIER/CRÉER USER GOODLIFE
    console.log('\n👤 2. User goodlife.nexxaagents');
    console.log('-'.repeat(60));

    let user = await prisma.userAccount.findFirst({
      where: {
        accountId,
        email: 'ventas@goodlifecr.com',
      },
    });

    if (!user) {
      console.log('⚠️  User n\'existe pas - Création...');
      const passwordHash = await bcrypt.hash('4qFEZPjc8f', 10);
      user = await prisma.userAccount.create({
        data: {
          accountId,
          username: 'goodlife.nexxaagents',
          email: 'ventas@goodlifecr.com',
          passwordHash,
          name: 'GoodLife Admin',
          role: 'USER',
          status: 'ACTIVE',
        },
      });
      console.log(`✅ User créé: ${user.id}`);
    } else {
      console.log(`✅ User existe: ${user.email} (${user.id})`);
    }

    // 3. VÉRIFIER/CRÉER CLIENT CONFIG
    console.log('\n📋 3. ClientConfig');
    console.log('-'.repeat(60));

    let clientConfig = await prisma.clientConfig.findFirst({
      where: { accountId },
    });

    if (!clientConfig) {
      console.log('⚠️  ClientConfig n\'existe pas - Création...');
      clientConfig = await prisma.clientConfig.create({
        data: {
          accountId,
          clientKey: 'goodlife',
          name: 'GoodLife Costa Rica',
          channels: ['WHATSAPP'],
          status: 'ACTIVE',
        },
      });
      console.log(`✅ ClientConfig créé: ${clientConfig.id}`);
    } else {
      console.log(`✅ ClientConfig existe: ${clientConfig.clientKey} (${clientConfig.id})`);
    }

    // 4. VÉRIFIER/CRÉER INBOX WHATSAPP
    console.log('\n📥 4. Inbox WhatsApp');
    console.log('-'.repeat(60));

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '966520989876579';

    let inbox = await prisma.inbox.findFirst({
      where: {
        accountId,
        channel: 'WHATSAPP',
      },
    });

    if (!inbox) {
      console.log('⚠️  Inbox WhatsApp n\'existe pas - Création...');
      inbox = await prisma.inbox.create({
        data: {
          accountId,
          name: 'WhatsApp GoodLife',
          channel: 'WHATSAPP',
          externalId: phoneNumberId,
        },
      });
      console.log(`✅ Inbox créé: ${inbox.id}`);
      console.log(`   External ID: ${inbox.externalId}`);
    } else {
      console.log(`✅ Inbox existe: ${inbox.name} (${inbox.id})`);
      console.log(`   External ID: ${inbox.externalId}`);

      // Update externalId si différent
      if (inbox.externalId !== phoneNumberId) {
        console.log(`⚠️  Mise à jour External ID: ${inbox.externalId} → ${phoneNumberId}`);
        inbox = await prisma.inbox.update({
          where: { id: inbox.id },
          data: { externalId: phoneNumberId },
        });
        console.log(`✅ External ID mis à jour`);
      }
    }

    // 5. VÉRIFIER/CRÉER EXTERNAL ACCOUNT
    console.log('\n🔗 5. ExternalAccount (WhatsApp routing)');
    console.log('-'.repeat(60));

    let externalAccount = await prisma.externalAccount.findFirst({
      where: {
        accountId,
        channel: 'WHATSAPP',
        externalId: phoneNumberId,
      },
    });

    if (!externalAccount) {
      console.log('⚠️  ExternalAccount n\'existe pas - Création...');
      externalAccount = await prisma.externalAccount.create({
        data: {
          accountId,
          channel: 'WHATSAPP',
          externalId: phoneNumberId,
          clientKey: 'goodlife',
          name: 'GoodLife WhatsApp',
        },
      });
      console.log(`✅ ExternalAccount créé: ${externalAccount.id}`);
    } else {
      console.log(`✅ ExternalAccount existe: ${externalAccount.id}`);
    }

    // 6. VÉRIFIER/CRÉER CORPORATE CONTACTS
    console.log('\n🏢 6. Corporate Contacts');
    console.log('-'.repeat(60));

    const corporateContactsData = [
      { name: 'Brandon Cookhorn Etiplast', phone: '+50661386837' },
      { name: 'Yeudy Araya Herrera', phone: '+50685323054' },
      { name: 'Erick Marchena', phone: '+50686815653' },
      { name: 'Michael Streda', phone: '+50671315444' },
      { name: 'Goodlife Lindora', phone: '+50689784910' },
      { name: 'Goodlife Santa Ana', phone: '+50689784900' },
      { name: 'Yenci Benavides Etiquetas', phone: '+50663472858' },
      { name: 'Helen Valverde Sport City Curri', phone: '+50683419449' },
      { name: 'Vivian Villegas SportCity Curri', phone: '+50683878226' },
      { name: 'Isabel Mesén Sport City Curri', phone: '+50687057802' },
      { name: 'Wendy Vargas Etiplast', phone: '+50689555893' },
      { name: 'Rosy Bolanos Jacks', phone: '+50687006867' },
      { name: 'Tatiana Alfaro Alajuela', phone: '+50663204010' },
      { name: 'Adriana Rojas Alajuela', phone: '+50663204011' },
      { name: 'Alejandra Villalobos Multiplaza', phone: '+50661282653' },
      { name: 'Gabriela Torres Forum', phone: '+50683092270' },
    ];

    let created = 0;
    let existing = 0;

    for (const contactData of corporateContactsData) {
      const existingContact = await prisma.contact.findFirst({
        where: {
          accountId,
          phone: contactData.phone,
        },
      });

      if (!existingContact) {
        await prisma.contact.create({
          data: {
            name: contactData.name,
            phone: contactData.phone,
            isCorporate: true,
            account: {
              connect: { id: accountId },
            },
            inbox: {
              connect: { id: inbox.id },
            },
          },
        });
        created++;
      } else {
        // Mettre à jour isCorporate si nécessaire
        if (!existingContact.isCorporate) {
          await prisma.contact.update({
            where: { id: existingContact.id },
            data: { isCorporate: true },
          });
        }
        existing++;
      }
    }

    console.log(`✅ Corporate contacts: ${created} créés, ${existing} existants`);
    console.log(`   Total: ${created + existing}/16`);

    // 7. VÉRIFIER USER PREFERENCES
    console.log('\n⚙️  7. User Preferences');
    console.log('-'.repeat(60));

    let userPreferences = await prisma.userPreference.findFirst({
      where: { userAccountId: user.id },
    });

    if (!userPreferences) {
      console.log('⚠️  User preferences n\'existent pas - Création...');
      userPreferences = await prisma.userPreference.create({
        data: {
          userAccountId: user.id,
          theme: 'DEFAULT',
          language: 'ES',
          timezone: 'America/Costa_Rica',
        },
      });
      console.log(`✅ User preferences créées`);
    } else {
      console.log(`✅ User preferences existent`);
    }

    // 8. RÉSUMÉ
    console.log('\n' + '='.repeat(60));
    console.log('✅ SYNCHRONISATION TERMINÉE\n');
    console.log('Résumé:');
    console.log(`  Account ID: ${accountId}`);
    console.log(`  User ID: ${user.id}`);
    console.log(`  Inbox ID: ${inbox.id}`);
    console.log(`  ExternalAccount ID: ${externalAccount.id}`);
    console.log(`  Corporate Contacts: ${created + existing}`);
    console.log('\nLa DB production est maintenant synchronisée! 🎉\n');

    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ ERREUR:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

syncProductionDB();

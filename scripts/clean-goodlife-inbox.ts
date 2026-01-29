#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const prisma = new PrismaClient();

async function cleanGoodLifeInbox() {
  console.log('🧹 Nettoyage de l\'inbox GoodLife...\n');

  // 1. Trouver le compte GoodLife
  const goodLifeAccount = await prisma.account.findFirst({
    where: { name: { contains: 'Goodlife', mode: 'insensitive' } },
  });

  if (!goodLifeAccount) {
    console.log('❌ Compte GoodLife non trouvé !');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`✅ Compte trouvé: ${goodLifeAccount.name}\n`);

  // 2. Trouver les inboxes du compte GoodLife
  const inboxes = await prisma.inbox.findMany({
    where: { accountId: goodLifeAccount.id },
    select: { id: true, name: true },
  });

  if (inboxes.length === 0) {
    console.log('⚠️  Aucune inbox trouvée pour GoodLife\n');
    await prisma.$disconnect();
    return;
  }

  console.log(`📥 Inboxes trouvées: ${inboxes.length}`);
  inboxes.forEach(inbox => console.log(`   - ${inbox.name} (${inbox.id})`));
  console.log('');

  const inboxIds = inboxes.map(i => i.id);

  // 3. Compter les conversations existantes
  const conversationsCount = await prisma.conversation.count({
    where: { inboxId: { in: inboxIds } },
  });

  console.log(`📊 Conversations existantes: ${conversationsCount}\n`);

  if (conversationsCount === 0) {
    console.log('✨ Inbox déjà vide !\n');
    await prisma.$disconnect();
    return;
  }

  // 4. Supprimer toutes les conversations et leurs messages
  console.log('🗑️  Suppression en cours...\n');

  // Récupérer les IDs des conversations à supprimer
  const conversations = await prisma.conversation.findMany({
    where: { inboxId: { in: inboxIds } },
    select: { id: true },
  });

  const conversationIds = conversations.map(c => c.id);

  if (conversationIds.length > 0) {
    // Supprimer les messages liés aux conversations
    const deletedMessages = await prisma.message.deleteMany({
      where: { conversationId: { in: conversationIds } },
    });
    console.log(`   ✅ ${deletedMessages.count} messages supprimés`);

    // Supprimer les conversations
    const deletedConversations = await prisma.conversation.deleteMany({
      where: { id: { in: conversationIds } },
    });
    console.log(`   ✅ ${deletedConversations.count} conversations supprimées\n`);
  }

  // 5. Supprimer les contacts orphelins (optionnel)
  const contactsCount = await prisma.contact.count({
    where: { inboxId: { in: inboxIds } },
  });

  if (contactsCount > 0) {
    const deletedContacts = await prisma.contact.deleteMany({
      where: { inboxId: { in: inboxIds } },
    });
    console.log(`   ✅ ${deletedContacts.count} contacts supprimés\n`);
  }

  // 6. Vérifier que l'inbox est vide
  const remainingCount = await prisma.conversation.count({
    where: { inboxId: { in: inboxIds } },
  });

  if (remainingCount === 0) {
    console.log('✨ Inbox GoodLife nettoyée avec succès !\n');
  } else {
    console.log(`⚠️  Il reste ${remainingCount} conversations\n`);
  }

  await prisma.$disconnect();
}

cleanGoodLifeInbox().catch((error) => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

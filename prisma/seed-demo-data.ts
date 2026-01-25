import 'dotenv/config';
import { PrismaClient, MessageDirection, AlertType, AlertPriority, LeadStatus, Temperature, FeedbackType, FeedbackStatus, Channel } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL missing');

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Fake data generators
const FIRST_NAMES = ['Sophie', 'Thomas', 'Marie', 'Lucas', 'Emma', 'Antoine', 'Julie', 'Nicolas', 'Camille', 'Pierre'];
const LAST_NAMES = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'];
const COMPANIES = ['TechCorp', 'InnoSolutions', 'DigitalPro', 'CloudMasters', 'DataSystems', 'WebExperts'];
const CHANNELS: Channel[] = ['INSTAGRAM', 'FACEBOOK', 'WHATSAPP'];
const TAGS = ['hot', 'qualified', 'new', 'pending', 'follow-up', 'demo-requested'];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generatePhoneNumber(): string {
  return `+33 6 ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)}`;
}

function randomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

async function main() {
  console.log('🎭 Injecting demo/test data...\n');

  const nexxaAccount = await prisma.account.findFirst({ where: { name: 'Nexxa' } });
  const demoAccount = await prisma.account.findFirst({ where: { name: 'Nexxa Demo' } });

  if (!nexxaAccount || !demoAccount) {
    throw new Error('Accounts not found. Run seed-accounts.ts first.');
  }

  const valentinUser = await prisma.userAccount.findFirst({ where: { username: 'valentin' } });
  const demoUser = await prisma.userAccount.findFirst({ where: { username: 'nexa.demo' } });

  if (!valentinUser || !demoUser) {
    throw new Error('Users not found. Run seed-accounts.ts first.');
  }

  console.log('📊 Creating CRM data...\n');

  // Create Leads
  const leadStatuses: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'];
  const temperatures: Temperature[] = ['HOT', 'WARM'];

  for (let i = 0; i < 5; i++) {
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    await prisma.lead.create({
      data: {
        accountId: nexxaAccount.id,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone: generatePhoneNumber(),
        company: getRandomElement(COMPANIES),
        channel: getRandomElement(CHANNELS),
        status: getRandomElement(leadStatuses),
        temperature: getRandomElement(temperatures),
        tags: [getRandomElement(TAGS)],
        assignedTo: valentinUser.id,
        value: 1000 + Math.floor(Math.random() * 10000),
        currency: 'EUR',
        notes: `Lead intéressé par nos services - Contact via ${getRandomElement(CHANNELS)}`
      }
    });
  }

  for (let i = 0; i < 8; i++) {
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    await prisma.lead.create({
      data: {
        accountId: demoAccount.id,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone: generatePhoneNumber(),
        company: getRandomElement(COMPANIES),
        channel: getRandomElement(CHANNELS),
        status: getRandomElement(leadStatuses),
        temperature: getRandomElement(temperatures),
        tags: [getRandomElement(TAGS)],
        assignedTo: demoUser.id,
        value: 1000 + Math.floor(Math.random() * 10000),
        currency: 'EUR',
        notes: `Prospect qualifié - Suivi en cours`
      }
    });
  }
  console.log('✅ Created 13 leads');

  // Create Feedbacks
  const feedbackTypes: FeedbackType[] = ['COMPLAINT', 'SUGGESTION', 'PRAISE', 'GENERAL'];
  const feedbackStatuses: FeedbackStatus[] = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const feedbackMessages = [
    'Excellent service! Very responsive and professional.',
    'Great experience, would highly recommend.',
    'Good service but could improve response time.',
    'Satisfait du service, équipe compétente.',
    'Service rapide et efficace, merci!'
  ];

  for (let i = 0; i < 3; i++) {
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    await prisma.feedback.create({
      data: {
        accountId: nexxaAccount.id,
        customerName: `${firstName} ${lastName}`,
        customerEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        customerPhone: generatePhoneNumber(),
        type: getRandomElement(feedbackTypes),
        status: 'RESOLVED',
        rating: 4 + Math.floor(Math.random() * 2),
        message: getRandomElement(feedbackMessages),
        channel: getRandomElement(CHANNELS),
        createdAt: randomDate(60)
      }
    });
  }

  for (let i = 0; i < 5; i++) {
    const firstName = getRandomElement(FIRST_NAMES);
    const lastName = getRandomElement(LAST_NAMES);
    await prisma.feedback.create({
      data: {
        accountId: demoAccount.id,
        customerName: `${firstName} ${lastName}`,
        customerEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        customerPhone: generatePhoneNumber(),
        type: getRandomElement(feedbackTypes),
        status: getRandomElement(feedbackStatuses),
        rating: 3 + Math.floor(Math.random() * 3),
        message: getRandomElement(feedbackMessages),
        channel: getRandomElement(CHANNELS),
        createdAt: randomDate(60)
      }
    });
  }
  console.log('✅ Created 8 feedbacks');

  console.log('\n💬 Creating Inbox data...\n');

  // Create Inboxes
  const nexxaInbox = await prisma.inbox.create({
    data: {
      accountId: nexxaAccount.id,
      name: 'Main Inbox',
      channel: 'WHATSAPP',
      externalId: `inbox_nexxa_${Date.now()}`
    }
  });

  const demoInbox = await prisma.inbox.create({
    data: {
      accountId: demoAccount.id,
      name: 'Demo Inbox',
      channel: 'WHATSAPP',
      externalId: `inbox_demo_${Date.now()}`
    }
  });
  console.log('✅ Created 2 inboxes');

  // Create Conversations + Messages
  for (let i = 0; i < 5; i++) {
    await createConversationWithMessages(nexxaAccount.id, nexxaInbox.id);
  }
  console.log('✅ Created 5 conversations for Nexxa');

  for (let i = 0; i < 10; i++) {
    await createConversationWithMessages(demoAccount.id, demoInbox.id);
  }
  console.log('✅ Created 10 conversations for Demo');

  console.log('\n🚨 Creating Alerts...\n');

  // Create Alerts
  const alertTypes: AlertType[] = ['PAYMENT', 'HANDOFF', 'SYSTEM'];
  const alertPriorities: AlertPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
  const alertMessages = [
    'Nouveau lead avec score élevé détecté',
    'Conversation non répondue depuis 2h',
    'Quota mensuel atteint à 80%',
    'Nouveau feedback 5 étoiles reçu',
    'Webhook Instagram nécessite attention'
  ];

  for (let i = 0; i < 2; i++) {
    await prisma.alert.create({
      data: {
        accountId: nexxaAccount.id,
        type: getRandomElement(alertTypes),
        priority: getRandomElement(alertPriorities),
        title: `Alert Nexxa #${i + 1}`,
        subtitle: getRandomElement(alertMessages),
        assignee: valentinUser.id,
        status: Math.random() > 0.5 ? 'OPEN' : 'RESOLVED',
        createdAt: randomDate(14)
      }
    });
  }

  for (let i = 0; i < 3; i++) {
    await prisma.alert.create({
      data: {
        accountId: demoAccount.id,
        type: getRandomElement(alertTypes),
        priority: getRandomElement(alertPriorities),
        title: `Demo Alert #${i + 1}`,
        subtitle: getRandomElement(alertMessages),
        assignee: demoUser.id,
        status: Math.random() > 0.5 ? 'OPEN' : 'RESOLVED',
        createdAt: randomDate(14)
      }
    });
  }
  console.log('✅ Created 5 alerts');

  console.log('\n✅ Demo data injection complete!\n');
  console.log('📊 Summary:');
  console.log('  - 13 Leads (5 Nexxa + 8 Demo)');
  console.log('  - 8 Feedbacks (3 Nexxa + 5 Demo)');
  console.log('  - 2 Inboxes');
  console.log('  - 15 Conversations (5 Nexxa + 10 Demo)');
  console.log('  - ~90 Messages');
  console.log('  - 5 Alerts (2 Nexxa + 3 Demo)');
  console.log('\n🎉 All modules now have visible test data!');
}

async function createConversationWithMessages(accountId: string, inboxId: string) {
  const firstName = getRandomElement(FIRST_NAMES);
  const lastName = getRandomElement(LAST_NAMES);
  const channel = getRandomElement(CHANNELS);

  // Create Contact
  const contact = await prisma.contact.create({
    data: {
      accountId,
      inboxId,
      phone: generatePhoneNumber(),
      name: `${firstName} ${lastName}`
    }
  });

  // Create Conversation
  const conversation = await prisma.conversation.create({
    data: {
      inboxId,
      contactId: contact.id,
      channel,
      status: getRandomElement(['OPEN', 'OPEN', 'PENDING', 'CLOSED']),
      lastActivityAt: randomDate(7)
    }
  });

  // Create Messages (3-8 per conversation)
  const messageCount = 3 + Math.floor(Math.random() * 6);
  const incomingMessages = [
    'Bonjour, je suis intéressé par vos services.',
    'Quels sont vos tarifs ?',
    'Pouvez-vous me donner plus d\'informations ?',
    'Merci pour votre réponse rapide !',
    'Je souhaiterais planifier un rendez-vous.',
    'Est-ce que vous avez des disponibilités cette semaine ?',
    'Parfait, je vous remercie pour ces informations.',
    'Avez-vous une brochure à m\'envoyer ?'
  ];
  const outgoingMessages = [
    'Bonjour ! Merci de votre intérêt. Comment puis-je vous aider ?',
    'Nos tarifs commencent à partir de 99€/mois.',
    'Bien sûr, je vous envoie la documentation.',
    'Avec plaisir ! N\'hésitez pas si vous avez d\'autres questions.',
    'Parfait ! Je vous propose mardi ou jeudi prochain.',
    'Oui, nous avons des créneaux disponibles.',
    'Je vous envoie ça par email tout de suite.',
    'N\'hésitez pas à me recontacter si besoin.'
  ];

  for (let i = 0; i < messageCount; i++) {
    const isIncoming = i % 2 === 0;
    const messageText = isIncoming ? getRandomElement(incomingMessages) : getRandomElement(outgoingMessages);
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        text: messageText,
        direction: isIncoming ? MessageDirection.IN : MessageDirection.OUT,
        channel,
        from: isIncoming ? contact.phone : undefined,
        to: isIncoming ? undefined : contact.phone,
        externalId: `msg_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(Date.now() - (messageCount - i) * 3600000) // 1h apart
      }
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ Error injecting demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

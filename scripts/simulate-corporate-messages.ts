#!/usr/bin/env ts-node
import 'dotenv/config';

const WEBHOOK_URL = 'https://skybot-inbox.onrender.com/api/webhooks/whatsapp';
const PHONE_NUMBER_ID = '60925012724039335';
const TO_NUMBER = '+50660213707'; // GoodLife WhatsApp number

const corporateContacts = [
  { name: 'Pamela Chavarria', phone: '+50688284915', role: 'Team' },
  { name: 'Marcello Allegra', phone: '+50687057802', role: 'Management' },
  { name: 'Marcela Robles', phone: '+50683878226', role: 'Team' },
  { name: 'Team Administración', phone: '+50683419449', role: 'Administration' },
  { name: 'Bodega', phone: '+50663472858', role: 'Bodega' },
  { name: 'Goodlife Sabana', phone: '+50689784900', role: 'Team' },
  { name: 'Goodlife Lindora', phone: '+50689784910', role: 'Team' },
  { name: 'Michael Streda', phone: '+50671315444', role: 'Management' },
  { name: 'Erick Marchena', phone: '+50686815653', role: 'Team' },
  { name: 'Yeudy Araya Herrera', phone: '+50685323054', role: 'Team' },
  { name: 'Brandon Cookhorn Etiplast', phone: '+50661386837', role: 'Team' },
];

async function simulateMessage(contact: typeof corporateContacts[0], index: number) {
  const messageId = `wamid.sim${Date.now()}${index}`;
  const timestamp = Math.floor(Date.now() / 1000);

  const messages = [
    `Hola, soy ${contact.name} del equipo GoodLife 👋`,
    `Buenos días! Este es ${contact.name}, necesito acceso al sistema`,
    `Saludos! ${contact.name} reportándose - ${contact.role} 📱`,
  ];

  const message = messages[Math.floor(Math.random() * messages.length)];

  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WABA_ID',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: TO_NUMBER.replace('+', ''),
                phone_number_id: PHONE_NUMBER_ID,
              },
              contacts: [
                {
                  profile: {
                    name: contact.name,
                  },
                  wa_id: contact.phone.replace('+', ''),
                },
              ],
              messages: [
                {
                  from: contact.phone.replace('+', ''),
                  id: messageId,
                  timestamp: timestamp.toString(),
                  type: 'text',
                  text: {
                    body: message,
                  },
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };

  console.log(`📤 Sending message from ${contact.name} (${contact.phone})...`);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`   ✅ Message delivered - Status: ${response.status}`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Failed - Status: ${response.status}, Error: ${errorText}`);
    }
  } catch (error) {
    console.error(`   ❌ Network error:`, error);
  }

  // Small delay between messages to avoid overwhelming the server
  await new Promise(resolve => setTimeout(resolve, 500));
}

async function main() {
  console.log('\n🚀 Simulating WhatsApp messages from corporate contacts...\n');
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log(`Phone Number ID: ${PHONE_NUMBER_ID}`);
  console.log(`Total contacts: ${corporateContacts.length}\n`);
  console.log('='.repeat(60));

  for (let i = 0; i < corporateContacts.length; i++) {
    await simulateMessage(corporateContacts[i], i);
  }

  console.log('='.repeat(60));
  console.log('\n✅ All messages sent!');
  console.log('\n💡 Check the app at: https://skybot-inbox-ui.onrender.com');
  console.log('   Login: goodlife.nexxaagents / 4qFEZPjc8f\n');
}

main();

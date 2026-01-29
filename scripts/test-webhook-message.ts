#!/usr/bin/env ts-node
import 'dotenv/config';

async function testWebhookMessage() {
  console.log('\n🧪 Testing webhook message reception...\n');

  const webhookPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '1367562058487644',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '50660213707',
                phone_number_id: '966520989876579',
              },
              contacts: [
                {
                  profile: {
                    name: 'Test User',
                  },
                  wa_id: '50612345678',
                },
              ],
              messages: [
                {
                  from: '50612345678',
                  id: 'wamid.TEST' + Date.now(),
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  text: {
                    body: 'Test réception webhook - ' + new Date().toISOString(),
                  },
                  type: 'text',
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };

  console.log('📤 Sending test webhook to production...\n');

  try {
    const response = await fetch(
      'https://skybot-inbox.onrender.com/api/webhooks/whatsapp',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      }
    );

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Webhook test successful!');
      console.log('Now check the database for the new message.');
    } else {
      console.log('\n❌ Webhook test failed');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testWebhookMessage();

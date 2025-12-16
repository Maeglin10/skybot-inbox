import * as crypto from 'crypto';

const secret = process.env.WHATSAPP_APP_SECRET;
if (!secret) {
  throw new Error('WHATSAPP_APP_SECRET missing');
}

// ⚠️ BODY EXACT envoyé au webhook
const payload = JSON.stringify({
  entry: [
    {
      changes: [
        {
          value: {
            metadata: { phone_number_id: 'demo-inbox' },
            contacts: [{ wa_id: '573001112233', profile: { name: 'Val' } }],
            messages: [
              {
                id: 'wamid.SIGNTEST1',
                timestamp: '1734180953',
                text: { body: 'signed message' },
              },
            ],
          },
        },
      ],
    },
  ],
});

// HMAC
const signature =
  'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');

console.log('PAYLOAD:\n', payload);
console.log('\nSIGNATURE:\n', signature);

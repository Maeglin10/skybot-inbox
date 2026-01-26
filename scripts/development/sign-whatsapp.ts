import 'dotenv/config';
import * as crypto from 'node:crypto';

const secret = process.env.WHATSAPP_APP_SECRET;
if (!secret) throw new Error('WHATSAPP_APP_SECRET missing');

// Permet d’éviter les doublons en DB: msgId unique à chaque run
const msgId = `wamid.SIGNTEST_${Date.now()}`;

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
                id: msgId,
                timestamp: String(Math.floor(Date.now() / 1000)),
                text: { body: `signed message ${msgId}` },
              },
            ],
          },
        },
      ],
    },
  ],
});

const signature =
  'sha256=' +
  crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');

process.stdout.write(JSON.stringify({ payload, signature }, null, 2));

import type { WhatsAppCloudWebhook } from './dto/whatsapp-cloud.dto';

export type ParsedIncomingMessage = {
  from: string;
  messageId: string;
  timestamp: number;
  text?: string;
};

export function parseWhatsAppCloudWebhook(body: WhatsAppCloudWebhook): ParsedIncomingMessage {
  const entry = body.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  const msg = value?.messages?.[0];
  const from = msg?.from ?? '';
  const messageId = msg?.id ?? '';
  const timestamp = Number(msg?.timestamp ?? 0);

  const text = msg?.text?.body;

  return { from, messageId, timestamp, text };
}

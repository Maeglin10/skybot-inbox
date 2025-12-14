import type { WhatsAppCloudWebhook } from './dto/whatsapp-cloud.dto';

export type ParsedIncomingMessage = {
  inboxExternalId?: string;
  phone: string;
  contactName?: string;
  providerMessageId?: string;
  text?: string;
  sentAt?: string; // ISO
};

type WaText = { body?: string };
type WaMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  text?: WaText;
};
type WaContact = { wa_id?: string; profile?: { name?: string } };
type WaMetadata = { phone_number_id?: string };
type WaValue = {
  metadata?: WaMetadata;
  contacts?: WaContact[];
  messages?: WaMessage[];
};
type WaChange = { value?: WaValue };
type WaEntry = { changes?: WaChange[] };

export function parseWhatsAppCloudWebhook(
  body: WhatsAppCloudWebhook,
): ParsedIncomingMessage[] {
  const out: ParsedIncomingMessage[] = [];

  const entries = (body as unknown as { entry?: WaEntry[] }).entry ?? [];
  for (const entry of entries) {
    const changes = entry.changes ?? [];
    for (const ch of changes) {
      const value = ch.value;
      if (!value) continue;

      const metadata = value.metadata;
      const inboxExternalId = metadata?.phone_number_id;

      const contacts = value.contacts ?? [];
      const contactName = contacts[0]?.profile?.name;
      const waId = contacts[0]?.wa_id;

      const messages = value.messages ?? [];
      for (const msg of messages) {
        const phone = waId ?? msg.from;
        if (!phone) continue;

        const providerMessageId = msg.id;
        const text = msg.text?.body;

        const sentAt = msg.timestamp
          ? new Date(Number(msg.timestamp) * 1000).toISOString()
          : undefined;

        out.push({
          inboxExternalId,
          phone,
          contactName,
          providerMessageId,
          text,
          sentAt,
        });
      }
    }
  }

  return out;
}

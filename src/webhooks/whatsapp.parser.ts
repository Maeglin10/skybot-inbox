import type { WhatsAppCloudWebhook } from './dto/whatsapp-cloud.dto';

export type ParsedIncomingMessage = {
  inboxExternalId?: string;
  phone: string;
  contactName?: string;
  providerMessageId?: string;
  text?: string;
  sentAt?: string; // ISO string
};

// Helpers anti-any
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

export function parseWhatsAppCloudWebhook(
  body: WhatsAppCloudWebhook,
): ParsedIncomingMessage[] {
  const out: ParsedIncomingMessage[] = [];

  const root = body as unknown;
  if (!isRecord(root)) return out;

  const entries = asArray(root.entry);

  for (const entry of entries) {
    if (!isRecord(entry)) continue;
    const changes = asArray(entry.changes);

    for (const ch of changes) {
      if (!isRecord(ch)) continue;
      const value = ch.value;
      if (!isRecord(value)) continue;

      const messages = asArray(value.messages);
      const contacts = asArray(value.contacts);
      const metadata = isRecord(value.metadata) ? value.metadata : undefined;

      const inboxExternalId = metadata
        ? asString(metadata.phone_number_id)
        : undefined;

      const c0 = contacts[0];
      const contactName =
        isRecord(c0) && isRecord(c0.profile)
          ? asString(c0.profile.name)
          : undefined;
      const waId = isRecord(c0) ? asString(c0.wa_id) : undefined;

      for (const msg of messages) {
        if (!isRecord(msg)) continue;

        const providerMessageId = asString(msg.id);
        const from = asString(msg.from);
        const phone = waId ?? from;
        if (!phone) continue;

        const text = isRecord(msg.text) ? asString(msg.text.body) : undefined;

        const ts = asString(msg.timestamp);
        const sentAt =
          ts && !Number.isNaN(Number(ts))
            ? new Date(Number(ts) * 1000).toISOString()
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

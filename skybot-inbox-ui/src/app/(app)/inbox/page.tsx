import { apiGetServer } from '@/lib/api.server';
import { InboxShell } from '@/components/inbox/inbox-shell';
import type {
  InboxConversation,
  InboxConversationStatus,
} from '@/components/inbox/inbox-shell';

function normalizeDir(v: unknown): "IN" | "OUT" | undefined {
  if (v === "IN" || v === "OUT") return v;
  return undefined;
}

type RawContact = { name?: unknown; phone?: unknown };

type RawPreview = {
  text?: unknown;
  timestamp?: unknown;
  direction?: unknown;
};

type RawConversationLite = {
  id?: unknown;
  status?: unknown;
  contact?: RawContact;
  lastActivityAt?: unknown;
  preview?: RawPreview;
};

type RawListResponse = { items?: unknown; nextCursor?: unknown };

function normalizeStatus(s: unknown): InboxConversationStatus | undefined {
  return s === 'OPEN' || s === 'CLOSED' ? s : undefined;
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : String(v ?? '');
}

export default async function InboxPage() {
  const data = (await apiGetServer(
    '/conversations?limit=50&lite=1',
  )) as RawListResponse;
  const rawItems = Array.isArray(data?.items)
    ? (data.items as RawConversationLite[])
    : [];

  const items: InboxConversation[] = rawItems.map((c) => {
    const contact = c.contact
      ? {
          name: typeof c.contact.name === 'string' ? c.contact.name : null,
          phone: typeof c.contact.phone === 'string' ? c.contact.phone : null,
        }
      : undefined;

    const preview = c.preview
  ? {
      text:
        typeof c.preview.text === "string"
          ? c.preview.text
          : c.preview.text == null
            ? null
            : String(c.preview.text),
      timestamp: typeof c.preview.timestamp === "string" ? c.preview.timestamp : undefined,
      direction: normalizeDir(c.preview.direction) ?? "IN",
    }
  : undefined;

    return {
      id: asString(c.id),
      status: normalizeStatus(c.status),
      contact,
      lastActivityAt:
        typeof c.lastActivityAt === 'string' ? c.lastActivityAt : undefined,
      preview,
    };
  });

  return <InboxShell initialItems={items} />;
}

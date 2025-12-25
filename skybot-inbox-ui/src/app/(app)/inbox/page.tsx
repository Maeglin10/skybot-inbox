import { apiGetServer } from "@/lib/api.server";
import { InboxShell } from "@/components/inbox/inbox-shell";
import type {
  InboxConversation,
  InboxConversationStatus,
} from "@/components/inbox/inbox-shell";

type RawMsg = {
  text?: unknown;
  timestamp?: unknown;
  direction?: unknown;
};

type RawContact = {
  name?: unknown;
  phone?: unknown;
};

type RawConversation = {
  id?: unknown;
  status?: unknown;
  contact?: RawContact;
  lastActivityAt?: unknown;
  messages?: unknown;
};

type RawListResponse = {
  items?: unknown;
};

function normalizeStatus(s: unknown): InboxConversationStatus | undefined {
  if (s === "OPEN" || s === "CLOSED") return s;
  return undefined;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : String(v ?? "");
}

function isRawMsgArray(v: unknown): v is RawMsg[] {
  return Array.isArray(v);
}

export default async function InboxPage() {
  const data = (await apiGetServer("/conversations?limit=50")) as RawListResponse;

  const rawItems = Array.isArray(data?.items) ? (data.items as RawConversation[]) : [];

  const items: InboxConversation[] = rawItems.map((c) => {
    const msgs = isRawMsgArray(c.messages) ? c.messages : [];

    return {
      id: asString(c.id),
      status: normalizeStatus(c.status),
      contact: c.contact
        ? {
            name: typeof c.contact.name === "string" ? c.contact.name : null,
            phone: typeof c.contact.phone === "string" ? c.contact.phone : null,
          }
        : undefined,
      lastActivityAt: typeof c.lastActivityAt === "string" ? c.lastActivityAt : undefined,
      messages: msgs.map((m) => ({
        text: typeof m.text === "string" ? m.text : m.text == null ? null : String(m.text),
        timestamp: typeof m.timestamp === "string" ? m.timestamp : undefined,
        direction: m.direction === "OUT" ? "OUT" : "IN",
      })),
    };
  });

  return <InboxShell initialItems={items} />;
}
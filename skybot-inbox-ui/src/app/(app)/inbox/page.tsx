import { apiGetServer } from "@/lib/api.server";
import { InboxShell, type InboxConversation } from "@/components/inbox/inbox-shell";

type RawConv = {
  id: string;
  status?: string;
  contact?: { name?: string | null; phone?: string | null };
  lastActivityAt?: string;
  messages?: Array<{ text?: string | null; timestamp?: string; direction?: "IN" | "OUT" }>;
};

function normalizeStatus(s?: string): "OPEN" | "CLOSED" | undefined {
  if (!s) return undefined;
  const up = s.toUpperCase();
  if (up === "OPEN") return "OPEN";
  if (up === "CLOSED") return "CLOSED";
  return undefined;
}

export default async function InboxPage() {
  const data = (await apiGetServer("/conversations?limit=50")) as { items?: RawConv[] } | null;
  const raw = data?.items ?? [];

  const items: InboxConversation[] = raw.map((c) => ({
    id: c.id,
    status: normalizeStatus(c.status),
    contact: c.contact,
    lastActivityAt: c.lastActivityAt,
    messages: c.messages,
  }));

  return <InboxShell initialItems={items} />;
}
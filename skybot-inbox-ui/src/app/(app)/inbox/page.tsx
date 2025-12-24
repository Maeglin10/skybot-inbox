import { apiGetServer } from "@/lib/api.server";
import { InboxShell } from "@/components/inbox/inbox-shell";

export default async function InboxPage() {
  const data = await apiGetServer("/conversations?limit=50");
  const items = (data?.items ?? []) as Array<{
    id: string;
    status?: string;
    contact?: { name?: string | null; phone?: string | null };
    lastActivityAt?: string;
    messages?: Array<{ text?: string | null; timestamp?: string; direction?: "IN" | "OUT" }>;
  }>;

  return <InboxShell initialItems={items} />;
}
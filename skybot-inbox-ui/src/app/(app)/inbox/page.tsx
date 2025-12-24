import { apiGetServer } from "@/lib/api.server";
import { InboxShell } from "@/components/inbox/inbox-shell";

type Conv = {
  id: string;
  status?: string;
  contact?: { name?: string | null; phone?: string | null };
  lastActivityAt?: string;
  messages?: Array<{ text?: string | null; timestamp?: string; direction?: "IN" | "OUT" }>;
};

export default async function InboxPage() {
  const data = (await apiGetServer("/conversations?limit=50")) as { items?: Conv[] };
  const items = (data?.items ?? []) satisfies Conv[];
  return <InboxShell initialItems={items as Conv[]} />;
}

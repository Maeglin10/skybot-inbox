import { apiGetServer } from "@/lib/api.server";
import { InboxShell, type InboxConversation } from "@/components/inbox/inbox-shell";

export const dynamic = "force-dynamic";

type RawListResponse = {
  items?: unknown;
  nextCursor?: unknown;
};

function asNullableString(v: unknown): string | null {
  if (typeof v === "string") return v;
  return null;
}

export default async function InboxPage() {
  const data = (await apiGetServer(
    "/conversations?limit=50&lite=1&status=OPEN"
  )) as RawListResponse;

  const items = (Array.isArray(data?.items) ? data.items : []) as InboxConversation[];
  const nextCursor = asNullableString(data?.nextCursor);

  return <InboxShell initialItems={items} initialCursor={nextCursor} />;
}
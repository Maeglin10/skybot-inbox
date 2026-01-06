import { apiGetServer } from "@/lib/api.server";
import { InboxShell, type InboxConversation } from "@/components/inbox/inbox-shell";

export const dynamic = "force-dynamic";

type RawListResponse = {
  items?: unknown;
  nextCursor?: unknown;
};

function asNullableString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

export default async function InboxPage() {
  let items: InboxConversation[] = [];
  let nextCursor: string | null = null;

  try {
    const data = (await apiGetServer(
      "/conversations?limit=20&lite=1&status=OPEN"
    )) as RawListResponse;

    items = (Array.isArray(data?.items) ? data.items : []) as InboxConversation[];
    nextCursor = asNullableString(data?.nextCursor);
  } catch {
    items = [];
    nextCursor = null;
  }

  return (
    <main className="h-[calc(100vh-1px)] w-full min-w-0">
      <InboxShell initialItems={items} initialCursor={nextCursor} />
    </main>
  );
}
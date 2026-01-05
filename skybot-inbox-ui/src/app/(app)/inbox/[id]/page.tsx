import { apiGetServer } from "@/lib/api.server";
import InboxClient from "@/components/conversations/InboxClient";
import ConversationClient from "@/components/conversations/ConversationClient";

export const dynamic = "force-dynamic";

export default async function InboxConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const list = await apiGetServer("/conversations?limit=50&lite=1&status=OPEN");
  const items = list?.items ?? [];
  const nextCursor = list?.nextCursor ?? null;

  const conv = await apiGetServer(`/conversations/${id}`);

  return (
    <main className="mx-auto h-[calc(100vh-1px)] w-full max-w-6xl p-4">
      <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
        <div className="min-h-0">
          <InboxClient initialItems={items} initialCursor={nextCursor} />
        </div>

        <div className="min-h-0 min-w-0">
          <ConversationClient initial={conv} />
        </div>
      </div>
    </main>
  );
}
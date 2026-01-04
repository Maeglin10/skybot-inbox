import { apiGetServer } from "@/lib/api.server";
import InboxClient from "@/app/conversations/InboxClient";
import ConversationClient from "@/components/conversations/ConversationClient";

export default async function InboxConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const list = await apiGetServer("/conversations?limit=50&lite=1");
  const items = list?.items ?? [];
  const nextCursor = list?.nextCursor ?? null;

  const conv = await apiGetServer(`/conversations/${id}`);

  return (
    <main className="mx-auto w-full max-w-6xl">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
        <InboxClient initialItems={items} initialCursor={nextCursor} />
        <ConversationClient initial={conv} />
      </div>
    </main>
  );
}
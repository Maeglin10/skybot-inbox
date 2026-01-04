import Link from "next/link";
import { apiGetServer } from "@/lib/api.server";
import ConversationClient from "@/components/conversations/ConversationClient";
import type { Conversation } from '@/lib/types';

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

const conv = (await apiGetServer(`/conversations/${id}`)) as Conversation;
return <ConversationClient initial={conv} />;

  return (
    <main className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <Link href="/conversations" className="text-sm underline">
          Back
        </Link>
        <div className="text-xs text-white/60">{conv.id}</div>
      </div>

      <ConversationClient initial={conv} />
    </main>
  );
}
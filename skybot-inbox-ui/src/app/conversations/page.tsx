import Link from "next/link";
import { apiGetServer } from "@/lib/api.server";
import InboxClient from "@/app/conversations/InboxClient";

type ConvItem = {
  id: string;
  status: "OPEN" | "PENDING" | "CLOSED";
  lastActivityAt?: string | null;
  updatedAt: string;
  contact?: { name?: string | null; phone?: string | null } | null;
  messages?: { text?: string | null }[] | null;
};

export default async function ConversationsPage() {
  const data = await apiGetServer("/conversations?limit=50");
  const items: ConvItem[] = data?.items ?? [];
  const nextCursor: string | null = data?.nextCursor ?? null;

  return (
    <div className="rounded-xl border border-white/10 bg-black/40">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="text-sm text-white/70">Inbox</div>
        <Link className="text-xs text-white/60 underline" href="/">
          Home
        </Link>
      </div>
      <InboxClient initialItems={items} initialCursor={nextCursor} />
    </div>
  );
}
import Link from "next/link";
import { apiGetServer } from "@/lib/api.server";
import InboxClient from "./InboxClient";

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
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Conversations</h1>
        <Link className="text-sm underline" href="/">
          Home
        </Link>
      </div>

      <InboxClient initialItems={items} initialCursor={nextCursor} />
    </main>
  );
}
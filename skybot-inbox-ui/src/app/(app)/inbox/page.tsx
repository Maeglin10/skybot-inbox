import { apiGetServer } from "@/lib/api.server";
import InboxClient from "@/components/conversations/InboxClient";


export const dynamic = "force-dynamic";

type Status = "OPEN" | "PENDING" | "CLOSED";

type ConvItem = {
  id: string;
  status: Status;
  lastActivityAt?: string | null;
  updatedAt: string;
  contact?: { name?: string | null; phone?: string | null } | null;
  messages?: { text?: string | null }[] | null;
};

export default async function InboxPage() {
  const data = await apiGetServer("/conversations?limit=50&lite=1&status=OPEN");
  const items = (data?.items ?? []) as ConvItem[];
  const nextCursor = (data?.nextCursor ?? null) as string | null;

  return (
    <main className="mx-auto w-full max-w-6xl">
      <InboxClient initialItems={items} initialCursor={nextCursor} />
    </main>
  );
}
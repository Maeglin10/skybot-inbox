import Link from "next/link";
import { apiGetServer } from "@/lib/api.server";

export default async function ConversationsPage() {
  const data = await apiGetServer("/conversations?limit=50");
  const items = data?.items ?? [];

  return (
    <main style={{ padding: 16 }}>
      <h1>Conversations</h1>
      <ul>
        {items.map((c: any) => (
          <li key={c.id}>
            <Link href={`/conversations/${c.id}`}>{c.id} — {c.status}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

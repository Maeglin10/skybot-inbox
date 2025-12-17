import Link from "next/link";
import { apiGet } from "@/lib/api";

type Msg = {
  id: string;
  direction: string;
  text: string | null;
  externalId: string | null;
  createdAt: string;
};

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const conv = await apiGet(`/conversations/${params.id}`);
  const title = conv.contact?.name ?? conv.contact?.phone ?? conv.id;
  const messages: Msg[] = conv.messages ?? [];

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm underline">Back</Link>
        <div className="text-xs text-gray-500">{conv.status}</div>
      </header>

      <h1 className="text-xl font-semibold">{title}</h1>

      <div className="space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="rounded border p-3">
            <div className="text-xs text-gray-500">
              {m.direction} • {m.externalId ?? ""} • {new Date(m.createdAt).toLocaleString()}
            </div>
            <div>{m.text ?? ""}</div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-sm text-gray-500">No messages</div>
        )}
      </div>
    </main>
  );
}

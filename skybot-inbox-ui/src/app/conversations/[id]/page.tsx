import Link from "next/link";
import { apiGetServer } from "@/lib/api.server";
import Composer from "./Composer";
import StatusSelect from "./StatusSelect";

type Msg = {
  id: string;
  direction: "IN" | "OUT";
  text: string | null;
  externalId: string | null;
  createdAt: string;
};

export default async function ConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const conv = await apiGetServer(`/conversations/${id}`);
  const title = conv.contact?.name ?? conv.contact?.phone ?? conv.id;
  const messages: Msg[] = conv.messages ?? [];

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <Link href="/conversations" className="text-sm underline">
          Back
        </Link>
        <StatusSelect id={conv.id} status={conv.status} />
      </header>

      <h1 className="text-xl font-semibold">{title}</h1>

      <div className="space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="rounded border p-3">
            <div className="text-xs text-gray-500">
              {m.direction} • {m.externalId ?? ""} • {m.createdAt}
            </div>
            <div className="text-sm">{m.text ?? ""}</div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-sm text-gray-500">No messages</div>
        )}
      </div>

      <Composer conversationId={conv.id} />
    </main>
  );
}
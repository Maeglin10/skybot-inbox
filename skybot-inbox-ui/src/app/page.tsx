import Link from 'next/link';
import { apiGet } from '@/lib/api';

type ConvItem = {
  id: string;
  status: 'OPEN' | 'PENDING' | 'CLOSED';
  lastActivityAt: string;
  contact?: { name?: string | null; phone?: string };
  messages?: { text?: string | null; createdAt: string }[];
};

export default async function Home() {
  const data = await apiGet('/conversations?limit=20');
  const items: ConvItem[] = data.items ?? [];

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Conversations</h1>
        <div className="text-sm text-gray-500">{items.length}</div>
      </header>

      <div className="space-y-2">
        {items.map((c) => {
          if (!c?.id) return null;

          const title = c.contact?.name ?? c.contact?.phone ?? c.id;
          const preview = c.messages?.[0]?.text ?? '';

          return (
            <Link
              key={c.id}
              href={`/conversations/${c.id}`}
              className="block rounded border p-3 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{title}</div>
                <div className="text-xs text-gray-500">{c.status}</div>
              </div>
              <div className="text-sm text-gray-600 truncate">{preview}</div>
            </Link>
          );
        })}

        {items.length === 0 && (
          <div className="text-sm text-gray-500">No conversations</div>
        )}
      </div>
    </main>
  );
}

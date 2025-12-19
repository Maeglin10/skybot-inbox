'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import StatusSelect from './StatusSelect';
import Composer from './Composer';
import { apiGetClient as apiGet, apiPostClient as apiPost } from '@/lib/api.client';

type Msg = {
  id: string;
  direction: 'IN' | 'OUT';
  text: string | null;
  externalId: string | null;
  createdAt: string;
};

type Conv = {
  id: string;
  status: 'OPEN' | 'PENDING' | 'CLOSED';
  contact?: { name?: string | null; phone?: string };
  messages?: Msg[];
};

export default function ConversationClient({
  convId,
  initial,
}: {
  convId: string;
  initial: Conv;
}) {
  const [conv, setConv] = useState<Conv>(initial);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<number | null>(null);

  const messages: Msg[] = useMemo(() => conv.messages ?? [], [conv.messages]);

  async function refresh() {
    setLoading(true);
    try {
      const next = (await apiGet(`/conversations/${convId}`)) as Conv;
      setConv(next);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // poll v1 (simple)
    timerRef.current = window.setInterval(() => {
      void refresh();
    }, 2500);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convId]);

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm underline">
          Back
        </Link>

        <div className="flex items-center gap-2">
          <StatusSelect id={conv.id} status={conv.status} />
          <button
            onClick={() => void refresh()}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </header>

      <h1 className="text-xl font-semibold">
        {conv.contact?.name ?? conv.contact?.phone ?? conv.id}
      </h1>

      <div className="space-y-2">
        {messages.map((m: Msg) => (
          <div key={m.id} className="rounded border p-3">
            <div className="text-xs text-gray-500">
              {m.direction} • {m.externalId ?? ''} •{' '}
              {new Date(m.createdAt).toLocaleString()}
            </div>
            <div className="text-sm">{m.text ?? ''}</div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-sm text-gray-500">No messages</div>
        )}
      </div>

      <Composer
        conversationId={convId}
        disabled={conv.status !== 'OPEN'}
        onSent={refresh}
      />
    </main>
  );
}
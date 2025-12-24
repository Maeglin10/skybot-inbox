'use client';

import * as React from 'react';
import { apiGetClient, apiPostClient } from '@/lib/api.client';

type Msg = {
  id: string;
  direction: 'IN' | 'OUT';
  text?: string | null;
  timestamp?: string;
  createdAt?: string;
};

export function Thread({ conversationId }: { conversationId: string | null }) {
  const [loading, setLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [to, setTo] = React.useState('573001112233');
  const [text, setText] = React.useState('');

  async function load() {
    if (!conversationId) return;
    setLoading(true);
    try {
      const data = await apiGetClient(`/conversations/${conversationId}`);
      setMessages(data?.messages ?? []);
      if (data?.contact?.phone) setTo(data.contact.phone);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  async function send() {
    if (!conversationId) return;
    const payload = { conversationId, to, text };
    setText('');
    await apiPostClient('/messages', payload);
    await load();
  }

  return (
    <section className="h-dvh flex flex-col min-w-0">
      <header className="border-b p-3">
        <div className="text-sm font-semibold">Thread</div>
        <div className="text-xs text-muted-foreground">
          {conversationId ?? '—'}
        </div>
      </header>

      <div className="flex-1 overflow-auto p-3 space-y-2">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={[
                'max-w-[70%] rounded-lg border px-3 py-2 text-sm whitespace-pre-wrap',
                m.direction === 'OUT' ? 'ml-auto bg-muted' : '',
              ].join(' ')}
            >
              {m.text ?? ''}
            </div>
          ))
        )}
      </div>

      <footer className="border-t p-3 flex gap-2">
        <input
          className="flex-1 border rounded-md px-3 py-2 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
        />
        <button
          className="border rounded-md px-3 py-2 text-sm"
          onClick={() => void send()}
          disabled={!text.trim() || !conversationId}
        >
          Send
        </button>
      </footer>
    </section>
  );
}
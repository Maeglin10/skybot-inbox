'use client';

import { useState } from 'react';

export default function SendMessageForm({
  conversationId,
}: {
  conversationId: string;
}) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!text.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, text }),
      });
      if (!res.ok) throw new Error(await res.text());
      setText('');
      // refresh simple
      window.location.reload();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSend} className="space-y-2">
      <div className="flex gap-2">
        <input
          className="w-full rounded border px-3 py-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
        />
        <button
          className="rounded border px-3 py-2"
          disabled={loading}
          type="submit"
        >
          Send
        </button>
      </div>
      {err && <div className="text-sm text-red-600">{err}</div>}
    </form>
  );
}

'use client';

import { useState } from 'react';
import { apiPostClient } from '@/lib/api.client';

export default function Composer({ conversationId }: { conversationId: string }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await apiPostClient('/messages', { conversationId, text });
      setText('');
      location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2 border-t pt-3">
      <input
        className="flex-1 border rounded px-3 py-2 text-sm"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message…"
      />
      <button
        onClick={send}
        disabled={loading}
        className="px-4 py-2 text-sm rounded bg-black text-white disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
}
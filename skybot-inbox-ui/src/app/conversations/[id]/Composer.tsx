'use client';

import { useState } from 'react';
import { apiGetClient as apiGet, apiPostClient as apiPost } from '@/lib/api.client';

export default function Composer({
  conversationId,
  disabled,
  onSent,
}: {
  conversationId: string;
  disabled?: boolean;
  onSent?: () => void;
}) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    if (disabled) return;
    if (!text.trim()) return;

    setLoading(true);
    try {
      await apiPost('/messages', { conversationId, text });
      setText('');
      onSent?.();
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
        disabled={disabled || loading}
      />
      <button
        onClick={send}
        disabled={disabled || loading}
        className="px-4 py-2 text-sm rounded bg-black text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </div>
  );
}
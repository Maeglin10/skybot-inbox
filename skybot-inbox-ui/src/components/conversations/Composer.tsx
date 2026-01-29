'use client';

import { apiPostClient } from '@/lib/api.client';
import { useState, useRef, useCallback } from 'react';

type Message = {
  id: string;
  conversationId: string;
  direction: 'IN' | 'OUT';
  from: string;
  to: string;
  text: string;
  timestamp: string;
  createdAt: string;
  externalId?: string | null;
};

type Props = {
  conversationId: string;
  onOptimisticSend?: (text: string) => string; // retourne tempId
  onSendSuccess?: (tempId: string, real: Message) => void;
  onSendFail?: (tempId: string) => void;
  onTyping?: (isTyping: boolean) => void; // typing indicator
};

export default function Composer({
  conversationId,
  onOptimisticSend,
  onSendSuccess,
  onSendFail,
  onTyping,
}: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const canSend = text.trim().length > 0 && !loading;

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      onTyping?.(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping?.(false);
    }, 2000);
  }, [isTyping, onTyping]);

  async function onSend() {
    if (!canSend) return;

    const clean = text.trim();
    setText('');
    setLoading(true);
    setError(null);

    const tempId = onOptimisticSend?.(clean) ?? `temp_${Date.now()}`;

    try {
      const real = (await apiPostClient(
        `/conversations/${conversationId}/messages`,
        { text: clean },
      )) as Message;

      onSendSuccess?.(tempId, real);
    } catch (e) {
      onSendFail?.(tempId);
      setText(clean);
      setError(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded border p-3 space-y-2">
      <div className="text-sm font-medium">Reply</div>

      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message…"
          className="flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
          disabled={loading}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />

        <button
          type="button"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
          onClick={onSend}
          disabled={!canSend}
        >
          {loading ? 'Sending…' : 'Send'}
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

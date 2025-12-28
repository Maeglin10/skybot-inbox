'use client';

import * as React from 'react';
import type { InboxConversation } from './inbox-shell';
import { sendMessage } from '@/lib/messages.client';

function fmt(ts?: string) {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function dirLabel(d?: 'IN' | 'OUT') {
  return d === 'OUT' ? 'You' : 'Contact';
}

export function InboxThread({
  conversation,
  loading,
  onRefresh,
}: {
  conversation: InboxConversation | null;
  loading?: boolean;
  onRefresh?: (full: InboxConversation) => void;
}) {
  const [text, setText] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const msgs = conversation?.messages ?? [];
  const to = conversation?.contact?.phone ?? '';

  async function send() {
    if (!conversation?.id) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!to) return;

    setSending(true);

    const optimistic = {
      text: trimmed,
      direction: 'OUT' as const,
      timestamp: new Date().toISOString(),
    };

    const nextConv: InboxConversation = {
      ...conversation,
      messages: [...msgs, optimistic],
      preview: {
        text: optimistic.text,
        timestamp: optimistic.timestamp,
        direction: optimistic.direction,
      },
      lastActivityAt: optimistic.timestamp,
    };

    onRefresh?.(nextConv);
    setText('');

    try {
      await sendMessage({ conversationId: conversation.id, to, text: trimmed });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {conversation?.contact?.name ||
              conversation?.contact?.phone ||
              'Conversation'}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {conversation?.contact?.phone || ''}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {loading ? 'Loading…' : (conversation?.status ?? '')}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {conversation == null ? (
          <div className="text-sm text-muted-foreground">
            No conversation selected.
          </div>
        ) : msgs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No messages.</div>
        ) : (
          msgs.map((m, idx) => {
            const isOut = m.direction === 'OUT';
            return (
              <div
                key={idx}
                className={[
                  'max-w-[80%] rounded-md border px-3 py-2 text-sm',
                  isOut ? 'ml-auto bg-muted' : 'mr-auto bg-background',
                ].join(' ')}
              >
                <div className="text-[11px] text-muted-foreground flex items-center justify-between gap-2">
                  <span>{dirLabel(m.direction)}</span>
                  <span>{fmt(m.timestamp)}</span>
                </div>
                <div className="mt-1 whitespace-pre-wrap break-words">
                  {m.text ?? ''}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-10 flex-1 rounded-md border px-3 text-sm"
          placeholder="Type a message…"
          disabled={!conversation?.id || sending}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button
          type="button"
          className="h-10 rounded-md border px-4 text-sm hover:bg-muted disabled:opacity-50"
          disabled={!conversation?.id || sending || !text.trim() || !to}
          onClick={() => void send()}
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}

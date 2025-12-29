'use client';

import * as React from 'react';
import type { InboxConversation } from './inbox-shell';
import { sendMessage, listMessages } from '@/lib/messages.client';
import { fetchConversation } from '@/lib/inbox.client';

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

type Msg = NonNullable<InboxConversation['messages']>[number];

function msgKey(m: Msg, idx: number) {
  const ts = typeof m.timestamp === 'string' ? m.timestamp : '';
  const dir = m.direction === 'IN' || m.direction === 'OUT' ? m.direction : '';
  const text = typeof m.text === 'string' ? m.text : '';
  const base = `${ts}|${dir}|${text}`;
  return base === '||' ? `idx:${idx}` : base;
}

function dedupeMessages(messages: Msg[]): Msg[] {
  const seen = new Set<string>();
  const out: Msg[] = [];
  for (let i = 0; i < messages.length; i++) {
    const k = msgKey(messages[i], i);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(messages[i]);
  }
  return out;
}

function toThreadMsg(m: {
  text: string | null;
  timestamp: string;
  direction: unknown;
}): Msg {
  return {
    text: m.text ?? null,
    timestamp: m.timestamp,
    direction: m.direction === 'IN' || m.direction === 'OUT' ? m.direction : 'IN',
  };
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

  // pagination state (older messages)
  const [olderCursor, setOlderCursor] = React.useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = React.useState(false);

  const listRef = React.useRef<HTMLDivElement | null>(null);
  const lockRef = React.useRef(false);

  // reset when conversation changes
  React.useEffect(() => {
    setOlderCursor(null);
    setLoadingOlder(false);
    lockRef.current = false;
  }, [conversation?.id]);

  const msgs = React.useMemo(() => {
    const arr = conversation?.messages ?? [];
    return dedupeMessages(arr);
  }, [conversation?.messages]);

  const to = conversation?.contact?.phone ?? '';

  async function send() {
    if (!conversation?.id) return;
    const convId = conversation.id;

    const trimmed = text.trim();
    if (!trimmed) return;
    if (!to) return;

    setSending(true);

    const optimistic: Msg = {
      text: trimmed,
      direction: 'OUT',
      timestamp: new Date().toISOString(),
    };

    const nextConv: InboxConversation = {
      ...conversation,
      messages: [...msgs, optimistic],
      preview: {
        text: optimistic.text ?? null,
        timestamp: optimistic.timestamp,
        direction: optimistic.direction,
      },
      lastActivityAt: optimistic.timestamp,
    };

    onRefresh?.(nextConv);
    setText('');

    try {
      await sendMessage({ conversationId: convId, to, text: trimmed });
      const full = (await fetchConversation(convId)) as InboxConversation;
      onRefresh?.(full);
    } finally {
      setSending(false);
    }
  }

  // initialize olderCursor from backend (needs first page cursor)
  React.useEffect(() => {
    if (!conversation?.id) return;
    if (olderCursor !== null) return; // already initialized
    // use last message timestamp as starting cursor (backend uses createdAt cursor; timestamps align enough for paging)
    const first = msgs[0];
    const start = first?.timestamp ?? null;
    setOlderCursor(start);
  }, [conversation?.id, msgs, olderCursor]);

  async function loadOlder() {
    if (!conversation?.id) return;
    if (loadingOlder) return;
    if (!olderCursor) return;

    const el = listRef.current;
    if (!el) return;

    // prevent multiple triggers while scroll event floods
    if (lockRef.current) return;
    lockRef.current = true;

    setLoadingOlder(true);

    const prevScrollHeight = el.scrollHeight;
    const prevScrollTop = el.scrollTop;

    try {
      const data = await listMessages({
        conversationId: conversation.id,
        limit: 20,
        cursor: olderCursor,
      });

      const older = (Array.isArray(data.items) ? data.items : []).map(toThreadMsg);
      if (older.length === 0) {
        setOlderCursor(null);
        return;
      }

      const merged = dedupeMessages([...(older as Msg[]), ...msgs]);

      const nextConv: InboxConversation = {
        ...conversation,
        messages: merged,
      };

      onRefresh?.(nextConv);
      setOlderCursor(data.nextCursor ?? null);

      // restore anchor after DOM updates
      requestAnimationFrame(() => {
        const el2 = listRef.current;
        if (!el2) return;
        const newScrollHeight = el2.scrollHeight;
        const delta = newScrollHeight - prevScrollHeight;
        el2.scrollTop = prevScrollTop + delta;
      });
    } finally {
      setLoadingOlder(false);
      // small delay to avoid immediate retrigger at top
      window.setTimeout(() => {
        lockRef.current = false;
      }, 150);
    }
  }

    React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onScroll = () => {
      // guard TS + runtime
      const cur = listRef.current;
      if (!cur) return;
      if (cur.scrollTop < 80) void loadOlder();
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id, olderCursor, msgs, loadingOlder]);

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

      <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3">
        {conversation == null ? (
          <div className="text-sm text-muted-foreground">
            No conversation selected.
          </div>
        ) : msgs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No messages.</div>
        ) : (
          <>
            {olderCursor ? (
              <div className="pb-2">
                <button
                  type="button"
                  className="h-8 rounded-md border px-3 text-xs hover:bg-muted disabled:opacity-50"
                  disabled={loadingOlder}
                  onClick={() => void loadOlder()}
                >
                  {loadingOlder ? 'Loading…' : 'Load older'}
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-muted-foreground pb-2">
                Start of conversation
              </div>
            )}

            {msgs.map((m, idx) => {
              const isOut = m.direction === 'OUT';
              return (
                <div
                  key={msgKey(m, idx)}
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
            })}
          </>
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
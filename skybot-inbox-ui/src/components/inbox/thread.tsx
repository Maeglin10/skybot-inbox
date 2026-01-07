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
  id: string;
  text: string | null;
  timestamp: string;
  direction: unknown;
}): Msg {
  return {
    text: m.text ?? null,
    timestamp: m.timestamp,
    direction:
      m.direction === 'IN' || m.direction === 'OUT' ? m.direction : 'IN',
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

  const [olderCursor, setOlderCursor] = React.useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = React.useState(false);

  const listRef = React.useRef<HTMLDivElement | null>(null);
  const lockRef = React.useRef(false);
  const stickToBottomRef = React.useRef(true);

  const convId = conversation?.id ?? null;
  const to = conversation?.contact?.phone ?? '';

  const msgs = React.useMemo(() => {
    const arr = conversation?.messages ?? [];
    return dedupeMessages(arr);
  }, [conversation?.messages]);

  // reset state when switching conversation
  React.useEffect(() => {
    setOlderCursor(null);
    setLoadingOlder(false);
    lockRef.current = false;
    stickToBottomRef.current = true;

    // jump bottom after paint
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  }, [convId]);

  const updateStickiness = React.useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const threshold = 120;

    const sticky = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

    stickToBottomRef.current = sticky;

    (
      window as unknown as { __INBOX_STICKY_BOTTOM__?: boolean }
    ).__INBOX_STICKY_BOTTOM__ = sticky;
  }, []);

  // keep at bottom only when user is already near bottom
  React.useEffect(() => {
    if (!convId) return;
    if (!stickToBottomRef.current) return;

    (
      window as unknown as { __INBOX_STICKY_BOTTOM__?: boolean }
    ).__INBOX_STICKY_BOTTOM__ = true;

    requestAnimationFrame(() => {
      const el = listRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  }, [convId, msgs.length]);

  const loadOlder = React.useCallback(async () => {
    if (!convId) return;
    if (loadingOlder) return;
    if (!olderCursor) return;

    const el = listRef.current;
    if (!el) return;

    if (lockRef.current) return;
    lockRef.current = true;

    setLoadingOlder(true);

    const prevScrollHeight = el.scrollHeight;
    const prevScrollTop = el.scrollTop;

    try {
      const data = await listMessages({
        conversationId: convId,
        limit: 20,
        cursor: olderCursor,
      });

      const older = (Array.isArray(data.items) ? data.items : []).map(
        toThreadMsg,
      );
      if (older.length === 0) {
        setOlderCursor(null);
        return;
      }

      const merged = dedupeMessages([...(older as Msg[]), ...msgs]);

      if (conversation) {
        onRefresh?.({
          ...conversation,
          messages: merged,
        });
      }

      setOlderCursor(data.nextCursor ?? null);

      requestAnimationFrame(() => {
        const el2 = listRef.current;
        if (!el2) return;
        const newScrollHeight = el2.scrollHeight;
        const delta = newScrollHeight - prevScrollHeight;
        el2.scrollTop = prevScrollTop + delta;
      });
    } finally {
      setLoadingOlder(false);
      window.setTimeout(() => {
        lockRef.current = false;
      }, 150);
    }
  }, [convId, loadingOlder, olderCursor, msgs, conversation, onRefresh]);

  // init olderCursor (bootstrap) when conversation changes
  React.useEffect(() => {
    if (!convId) return;
    if (olderCursor !== null) return;

    (async () => {
      try {
        const data = await listMessages({ conversationId: convId, limit: 1 });
        setOlderCursor(data.nextCursor ?? null);
      } catch {
        setOlderCursor(null);
      }
    })();
  }, [convId, olderCursor]);

  // scroll listener (stable)
  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onScroll = () => {
      const cur = listRef.current;
      if (!cur) return;

      updateStickiness();

      if (cur.scrollTop < 80) void loadOlder();
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [updateStickiness, loadOlder]);

  const send = React.useCallback(async () => {
    if (!conversation?.id) return;
    if (!to) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    setSending(true);

    const optimistic: Msg = {
      text: trimmed,
      direction: 'OUT',
      timestamp: new Date().toISOString(),
    };

    onRefresh?.({
      ...conversation,
      messages: [...msgs, optimistic],
      preview: {
        text: optimistic.text ?? null,
        timestamp: optimistic.timestamp,
        direction: optimistic.direction,
      },
      lastActivityAt: optimistic.timestamp,
    });

    setText('');
    stickToBottomRef.current = true;

    try {
      await sendMessage({ conversationId: conversation.id, to, text: trimmed });
      const full = (await fetchConversation(
        conversation.id,
      )) as InboxConversation;
      onRefresh?.(full);
    } finally {
      setSending(false);
    }
  }, [conversation, to, text, msgs, onRefresh]);

  return (
    <div className="ui-thread">
      <div className="ui-thread__header">
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

      <div ref={listRef} className="ui-thread__list">
        {conversation == null ? (
          <div className="text-sm text-muted-foreground">
            No conversation selected.
          </div>
        ) : msgs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No messages.</div>
        ) : (
          <>
            {olderCursor ? (
              <div className="ui-thread__older">
                <button
                  type="button"
                  className="ui-btn"
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
                  className={`ui-msgrow ${isOut ? 'is-out' : ''}`}
                >
                  <div className={`ui-bubble ${isOut ? 'is-out' : ''}`}>
                    <div className="ui-bubble__text">{m.text ?? ''}</div>
                    <div className="ui-bubble__meta">
                      <span>{fmt(m.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="ui-composer">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="ui-input"
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
          className="ui-btn ui-btn--primary"
          disabled={!conversation?.id || sending || !text.trim() || !to}
          onClick={() => void send()}
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import Composer from './Composer';
import StatusSelect from './StatusSelect';

type Status = 'OPEN' | 'PENDING' | 'CLOSED';

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

type Conversation = {
  id: string;
  status: Status;
  updatedAt: string;
  lastActivityAt?: string;
  messages: Message[];
};

async function fetchConversation(id: string): Promise<Conversation> {
  const res = await fetch(`/api/proxy/conversations/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function isNearBottom(el: HTMLElement, thresholdPx = 120) {
  const distance = el.scrollHeight - (el.scrollTop + el.clientHeight);
  return distance <= thresholdPx;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatTs(iso: string) {
  const d = new Date(iso);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(
    d.getMinutes(),
  )}`;
}

function formatDayLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function groupByDay(messages: Message[]) {
  const groups: { key: string; label: string; items: Message[] }[] = [];
  for (const msg of messages) {
    const key = dayKey(msg.timestamp);
    const last = groups.at(-1);
    if (!last || last.key !== key) {
      groups.push({ key, label: formatDayLabel(msg.timestamp), items: [msg] });
    } else {
      last.items.push(msg);
    }
  }
  return groups;
}

export default function ConversationClient(props: { initial: Conversation }) {
  const [conv, setConv] = useState<Conversation>(props.initial);
  const [pollError, setPollError] = useState<string | null>(null);

  const latestUpdatedAtRef = useRef<string>(props.initial.updatedAt);

  const listRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const prevLastMessageIdRef = useRef<string | null>(props.initial.messages?.at(-1)?.id ?? null);

  const sortedMessages = useMemo(() => {
    return [...(conv.messages ?? [])].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }, [conv.messages]);

  const grouped = useMemo(() => groupByDay(sortedMessages), [sortedMessages]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onScroll = () => {
      shouldStickToBottomRef.current = isNearBottom(el, 160);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    shouldStickToBottomRef.current = isNearBottom(el, 160);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Polling léger: 5s, sans jump si l'utilisateur lit plus haut
  useEffect(() => {
    let alive = true;

    const tick = async () => {
      const el = listRef.current;
      const wasNearBottom = el ? isNearBottom(el, 160) : true;
      const prevScrollHeight = el?.scrollHeight ?? 0;
      const prevScrollTop = el?.scrollTop ?? 0;

      try {
        const next = await fetchConversation(conv.id);

        if (next.updatedAt !== latestUpdatedAtRef.current) {
          latestUpdatedAtRef.current = next.updatedAt;

          if (alive) {
            setConv(next);

            if (el && !wasNearBottom) {
              requestAnimationFrame(() => {
                const el2 = listRef.current;
                if (!el2) return;
                const newScrollHeight = el2.scrollHeight;
                const delta = newScrollHeight - prevScrollHeight;
                el2.scrollTop = prevScrollTop + delta;
              });
            }
          }
        }

        if (alive) setPollError(null);
      } catch (e) {
        if (alive) setPollError(e instanceof Error ? e.message : 'poll failed');
      }
    };

    const t = setInterval(tick, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [conv.id]);

  // Auto-scroll seulement si l'utilisateur "stick" en bas et qu'un nouveau message arrive
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const lastId = sortedMessages.at(-1)?.id ?? null;
    const prevLastId = prevLastMessageIdRef.current;

    if (lastId && lastId !== prevLastId) {
      prevLastMessageIdRef.current = lastId;
      if (shouldStickToBottomRef.current) el.scrollTop = el.scrollHeight;
    }
  }, [sortedMessages]);

  function optimisticAdd(text: string) {
    const now = new Date().toISOString();
    const tempId = `temp_${Math.random().toString(36).slice(2)}`;

    shouldStickToBottomRef.current = true;

    setConv((c) => ({
      ...c,
      updatedAt: now,
      lastActivityAt: now,
      messages: [
        ...(c.messages ?? []),
        {
          id: tempId,
          conversationId: c.id,
          direction: 'OUT',
          from: 'demo-inbox',
          to: 'contact',
          text,
          timestamp: now,
          createdAt: now,
          externalId: null,
        },
      ],
    }));

    return tempId;
  }

  function optimisticReplace(tempId: string, real: Message) {
    setConv((c) => ({
      ...c,
      updatedAt: real.createdAt ?? c.updatedAt,
      lastActivityAt: real.createdAt ?? c.lastActivityAt,
      messages: (c.messages ?? []).map((m) => (m.id === tempId ? real : m)),
    }));
  }

  function optimisticRemove(tempId: string) {
    setConv((c) => ({
      ...c,
      messages: (c.messages ?? []).filter((m) => m.id !== tempId),
    }));
  }

  function optimisticStatus(next: Status) {
    const now = new Date().toISOString();
    setConv((c) => ({ ...c, status: next, updatedAt: now }));
  }

  return (
    <div className="min-h-[calc(100vh-24px)] px-4 py-3">
      <div className="mx-auto w-full max-w-5xl">
        <div className="sticky top-0 z-10 mb-3 border-b bg-black/60 backdrop-blur supports-[backdrop-filter]:bg-black/40">
          <div className="flex items-center justify-between py-3">
            <div className="min-w-0">
              <div className="text-xs text-white/60">Conversation</div>
              <div className="truncate text-sm text-white/90">{conv.id}</div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-xs text-white/50 md:block">Updated {formatTs(conv.updatedAt)}</div>
              <StatusSelect id={conv.id} status={conv.status} onOptimisticChange={optimisticStatus} />
            </div>
          </div>

          {pollError && <div className="pb-3 text-xs text-amber-300">Poll error: {pollError}</div>}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40">
          <div ref={listRef} className="max-h-[62vh] overflow-auto px-3 py-4">
            {sortedMessages.length === 0 ? (
              <div className="py-10 text-center text-sm text-white/50">No messages</div>
            ) : (
              <div className="space-y-6">
                {grouped.map((g) => (
                  <div key={g.key} className="space-y-3">
                    <div className="flex items-center justify-center">
                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/60">
                        {g.label}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {g.items.map((m) => {
                        const isOut = m.direction === 'OUT';
                        const isTemp = m.id.startsWith('temp_');

                        return (
                          <div key={m.id} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-[85%] md:max-w-[70%]">
                              <div
                                className={[
                                  'rounded-2xl px-3 py-2 text-sm leading-relaxed border',
                                  isOut
                                    ? 'bg-white/10 border-white/10 text-white'
                                    : 'bg-white/5 border-white/10 text-white/90',
                                ].join(' ')}
                              >
                                <div className="whitespace-pre-wrap break-words">{m.text}</div>
                              </div>

                              <div
                                className={[
                                  'mt-1 flex gap-2 text-[11px] text-white/45',
                                  isOut ? 'justify-end' : 'justify-start',
                                ].join(' ')}
                              >
                                <span>{m.direction}</span>
                                <span>•</span>
                                <span>{formatTs(m.timestamp)}</span>
                                {isTemp ? (
                                  <>
                                    <span>•</span>
                                    <span>sending</span>
                                  </>
                                ) : null}
                                {m.externalId ? (
                                  <>
                                    <span>•</span>
                                    <span className="truncate max-w-[260px]">{m.externalId}</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-3">
            <Composer
              conversationId={conv.id}
              onOptimisticSend={(text) => optimisticAdd(text)}
              onSendSuccess={(tempId, real) => optimisticReplace(tempId, real)}
              onSendFail={(tempId) => optimisticRemove(tempId)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
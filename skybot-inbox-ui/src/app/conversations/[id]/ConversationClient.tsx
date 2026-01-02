'use client';

import { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import Composer from "./Composer";
import StatusSelect from "./StatusSelect";

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
  const res = await fetch(`/api/proxy/conversations/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function isNearBottom(el: HTMLElement, thresholdPx = 120) {
  const distance = el.scrollHeight - (el.scrollTop + el.clientHeight);
  return distance <= thresholdPx;
}

export default function ConversationClient(props: { initial: Conversation }) {
  const [conv, setConv] = useState<Conversation>(props.initial);
  const [pollError, setPollError] = useState<string | null>(null);

  const latestUpdatedAtRef = useRef<string>(props.initial.updatedAt);

  const listRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const prevLastMessageIdRef = useRef<string | null>(
    props.initial.messages?.at(-1)?.id ?? null
  );

  const sortedMessages = useMemo(() => {
    return [...(conv.messages ?? [])].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }, [conv.messages]);

  // Track user scroll intent (stick to bottom only if user is near bottom)
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onScroll = () => {
      shouldStickToBottomRef.current = isNearBottom(el, 160);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    // init
    shouldStickToBottomRef.current = isNearBottom(el, 160);

    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Polling léger: 5s, sans jump
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

            // Preserve scroll if user is NOT near bottom
            // (useLayoutEffect below finalizes adjustments after render)
            if (el && !wasNearBottom) {
              // Store snapshot in refs via closure variables (layout effect uses current DOM)
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

  // Auto-scroll only when user is sticking to bottom AND a new message appears
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const lastId = sortedMessages.at(-1)?.id ?? null;
    const prevLastId = prevLastMessageIdRef.current;

    if (lastId && lastId !== prevLastId) {
      prevLastMessageIdRef.current = lastId;

      if (shouldStickToBottomRef.current) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [sortedMessages]);

  function optimisticAdd(text: string) {
    const now = new Date().toISOString();
    const tempId = `temp_${Math.random().toString(36).slice(2)}`;

    // optimistic implies user intent to continue at bottom
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">Conversation</div>

        <StatusSelect
          id={conv.id}
          status={conv.status}
          onOptimisticChange={optimisticStatus}
        />
      </div>

      {pollError && (
        <div className="text-sm text-amber-700">Poll: {pollError}</div>
      )}

      {/* LIST: fixed height + scroll */}
      <div
        ref={listRef}
        className="rounded border p-3 space-y-2 max-h-[60vh] overflow-auto"
      >
        {sortedMessages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="text-gray-500 mr-2">{m.direction}</span>
            <span>{m.text}</span>
          </div>
        ))}
      </div>

      <Composer
        conversationId={conv.id}
        onOptimisticSend={(text) => optimisticAdd(text)}
        onSendSuccess={(tempId, real) => optimisticReplace(tempId, real)}
        onSendFail={(tempId) => optimisticRemove(tempId)}
      />
    </div>
  );
}
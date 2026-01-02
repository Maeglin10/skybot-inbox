'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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

export default function ConversationClient(props: { initial: Conversation }) {
  const [conv, setConv] = useState<Conversation>(props.initial);
  const [pollError, setPollError] = useState<string | null>(null);

  const latestUpdatedAtRef = useRef<string>(props.initial.updatedAt);

  const sortedMessages = useMemo(() => {
    return [...(conv.messages ?? [])].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }, [conv.messages]);

  // Polling léger: 5s
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const next = await fetchConversation(conv.id);

        // évite de remplacer le state si rien n’a changé
        if (next.updatedAt !== latestUpdatedAtRef.current) {
          latestUpdatedAtRef.current = next.updatedAt;
          if (alive) setConv(next);
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

  function optimisticAdd(text: string) {
    const now = new Date().toISOString();
    const tempId = `temp_${Math.random().toString(36).slice(2)}`;

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

      <div className="rounded border p-3 space-y-2">
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

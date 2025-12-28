"use client";

import * as React from "react";
import { InboxList } from "./list";
import { InboxThread } from "./thread";
import { fetchConversation } from "@/lib/inbox.client";

export type InboxConversationStatus = 'OPEN' | 'CLOSED';

export type InboxConversation = {
  id: string;
  status?: InboxConversationStatus;
  contact?: { name?: string | null; phone?: string | null };
  lastActivityAt?: string;

  // détail (thread)
  messages?: Array<{
    text?: string | null;
    timestamp?: string;
    direction?: 'IN' | 'OUT';
  }>;

  // listing lite (liste)
  preview?: {
    text?: string | null;
    timestamp?: string;
    direction?: 'IN' | 'OUT';
  };
};

export function InboxShell({ initialItems }: { initialItems: InboxConversation[] }) {
  const [items, setItems] = React.useState<InboxConversation[]>(initialItems);
  const [activeId, setActiveId] = React.useState<string | null>(initialItems[0]?.id ?? null);
  const [active, setActive] = React.useState<InboxConversation | null>(initialItems[0] ?? null);
  const [loading, setLoading] = React.useState(false);

  const refresh = React.useCallback((full: InboxConversation) => {
    setActive(full);
    setItems((prev) => prev.map((c) => (c.id === full.id ? { ...c, ...full } : c)));
  }, []);

  const select = React.useCallback(async (id: string) => {
    setActiveId(id);
    setLoading(true);
    try {
      const full = (await fetchConversation(id)) as InboxConversation;
      refresh(full);
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  React.useEffect(() => {
    if (!activeId) return;
    void select(activeId);
  }, [activeId, select]);

  React.useEffect(() => {
    if (!activeId) return;
    const t = window.setInterval(() => void select(activeId), 3000);
    return () => window.clearInterval(t);
  }, [activeId, select]);

  const sortedItems = React.useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const ta = a.lastActivityAt ? Date.parse(a.lastActivityAt) : 0;
      const tb = b.lastActivityAt ? Date.parse(b.lastActivityAt) : 0;
      return tb - ta;
    });
    return copy;
  }, [items]);

  return (
    <div className="h-[calc(100vh-1px)] w-full">
      <div className="grid h-full grid-cols-[360px_1fr]">
        <div className="border-r">
          <InboxList items={sortedItems} activeId={activeId} onSelect={select} />
        </div>
        <div className="min-w-0">
          <InboxThread conversation={active} loading={loading} onRefresh={refresh} />
        </div>
      </div>
    </div>
  );
}
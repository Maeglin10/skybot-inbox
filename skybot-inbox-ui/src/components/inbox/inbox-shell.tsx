"use client";

import * as React from "react";
import { InboxList } from "./list";
import { InboxThread } from "./thread";
import { fetchConversation } from "@/lib/inbox.client";
import { patchConversationStatus } from "@/lib/status.client";

export type InboxConversationStatus = "OPEN" | "CLOSED";

export type InboxConversation = {
  id: string;
  status?: InboxConversationStatus;
  contact?: { name?: string | null; phone?: string | null };
  lastActivityAt?: string;
  messages?: Array<{ text?: string | null; timestamp?: string; direction?: "IN" | "OUT" }>;
};

export function InboxShell({ initialItems }: { initialItems: InboxConversation[] }) {
  const [items, setItems] = React.useState<InboxConversation[]>(initialItems);
  const [activeId, setActiveId] = React.useState<string | null>(items[0]?.id ?? null);
  const [active, setActive] = React.useState<InboxConversation | null>(items[0] ?? null);
  const [loading, setLoading] = React.useState(false);

  async function select(id: string) {
    setActiveId(id);
    setLoading(true);
    try {
      const full = (await fetchConversation(id)) as InboxConversation;
      setActive(full);
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...full } : c)));
    } finally {
      setLoading(false);
    }
  }

  function refresh(full: InboxConversation) {
    setActive(full);
    setItems((prev) => prev.map((c) => (c.id === full.id ? { ...c, ...full } : c)));
  }

  async function toggleStatus(id: string, next: "OPEN" | "CLOSED") {
    // optimistic
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, status: next } : c)));
    if (active?.id === id) setActive({ ...active, status: next });

    try {
      await patchConversationStatus({ conversationId: id, status: next });
      const full = (await fetchConversation(id)) as InboxConversation;
      refresh(full);
    } catch {
      // rollback by refetch
      try {
        const full = (await fetchConversation(id)) as InboxConversation;
        refresh(full);
      } catch {
        // ignore
      }
    }
  }

  React.useEffect(() => {
    if (activeId && (!active || active.id !== activeId)) void select(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-[calc(100vh-1px)] w-full">
      <div className="grid h-full grid-cols-[360px_1fr]">
        <div className="border-r">
          <InboxList
            items={items}
            activeId={activeId}
            onSelect={select}
            onToggleStatus={toggleStatus}
          />
        </div>
        <div className="min-w-0">
          <InboxThread conversation={active} loading={loading} onRefresh={refresh} />
        </div>
      </div>
    </div>
  );
}
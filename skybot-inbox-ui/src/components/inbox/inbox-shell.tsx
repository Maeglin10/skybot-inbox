"use client";

import * as React from "react";
import { InboxList } from "./list";
import { InboxThread } from "./thread";
import { fetchConversation } from "@/lib/inbox.client";

export type InboxConversation = {
  id: string;
  status?: string;
  contact?: { name?: string | null; phone?: string | null };
  lastActivityAt?: string;
  messages?: Array<{ text?: string | null; timestamp?: string }>;
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

      // optionnel: rafraîchir preview/messages dans la liste
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...full } : c)));
    } finally {
      setLoading(false);
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
          <InboxList items={items} activeId={activeId} onSelect={select} />
        </div>
        <div className="min-w-0">
          <InboxThread conversation={active} loading={loading} />
        </div>
      </div>
    </div>
  );
}

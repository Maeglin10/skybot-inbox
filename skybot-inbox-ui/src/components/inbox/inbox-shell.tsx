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
  messages?: Array<{ text?: string | null; timestamp?: string; direction?: "IN" | "OUT" }>;
};

const POLL_MS = 5000;

export function InboxShell({ initialItems }: { initialItems: InboxConversation[] }) {
  const [items, setItems] = React.useState<InboxConversation[]>(initialItems);
  const [activeId, setActiveId] = React.useState<string | null>(items[0]?.id ?? null);
  const [active, setActive] = React.useState<InboxConversation | null>(items[0] ?? null);
  const [loading, setLoading] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);

  async function select(id: string) {
    setActiveId(id);
    setLoading(true);
    try {
      const full = (await fetchConversation(id)) as InboxConversation;
      refresh(full);
    } finally {
      setLoading(false);
    }
  }

  function refresh(full: InboxConversation) {
    setActive(full);
    setItems((prev) => prev.map((c) => (c.id === full.id ? { ...c, ...full } : c)));
  }

  // Initial fetch (si besoin)
  React.useEffect(() => {
    if (activeId && (!active || active.id !== activeId)) void select(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tab visibility tracking (pause polling quand onglet inactif)
  React.useEffect(() => {
    const onVis = () => setIsVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Polling conversation active
  React.useEffect(() => {
    if (!activeId) return;
    if (!isVisible) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const full = (await fetchConversation(activeId)) as InboxConversation;
        if (!cancelled) refresh(full);
      } catch {
        // ignore (réseau / backend down)
      }
    };

    // tick immédiat + interval
    void tick();
    const t = setInterval(() => void tick(), POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, isVisible]);

  return (
    <div className="h-[calc(100vh-1px)] w-full">
      <div className="grid h-full grid-cols-[360px_1fr]">
        <div className="border-r">
          <InboxList items={items} activeId={activeId} onSelect={select} />
        </div>
        <div className="min-w-0">
          <InboxThread conversation={active} loading={loading} onRefresh={refresh} />
        </div>
      </div>
    </div>
  );
}
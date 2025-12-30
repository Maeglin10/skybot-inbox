'use client';

import * as React from 'react';
import { InboxList } from './list';
import { InboxThread } from './thread';
import { fetchConversation, fetchConversations } from '@/lib/inbox.client';
import { patchConversationStatus } from '@/lib/status.client';

export type InboxConversationStatus = 'OPEN' | 'PENDING' | 'CLOSED';

export type InboxConversation = {
  id: string;
  status?: InboxConversationStatus;
  contact?: { name?: string | null; phone?: string | null };
  lastActivityAt?: string;

  messages?: Array<{
    text?: string | null;
    timestamp?: string;
    direction?: 'IN' | 'OUT';
  }>;

  preview?: {
    text?: string | null;
    timestamp?: string;
    direction?: 'IN' | 'OUT';
  };
};

type Filter = 'ALL' | InboxConversationStatus;

function derivePreview(c: InboxConversation): InboxConversation['preview'] {
  const msgs = c.messages ?? [];
  const last = msgs.length ? msgs[msgs.length - 1] : undefined;
  if (!last) return undefined;
  return {
    text: last.text ?? null,
    timestamp: last.timestamp,
    direction: last.direction,
  };
}

function computePollMs() {
  const msRaw = process.env.NEXT_PUBLIC_INBOX_POLL_MS;
  const n = msRaw ? Number(msRaw) : 3000;
  if (!Number.isFinite(n)) return 3000;
  return Math.min(Math.max(n, 1000), 15000);
}

export function InboxShell({
  initialItems,
  initialCursor,
}: {
  initialItems: InboxConversation[];
  initialCursor: string | null;
}) {
  const [filter, setFilter] = React.useState<Filter>('ALL');

  const [items, setItems] = React.useState<InboxConversation[]>(initialItems);
  const [cursor, setCursor] = React.useState<string | null>(initialCursor);

  const [activeId, setActiveId] = React.useState<string | null>(
    initialItems[0]?.id ?? null,
  );
  const [active, setActive] = React.useState<InboxConversation | null>(
    initialItems[0] ?? null,
  );

  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const pollMs = React.useMemo(() => computePollMs(), []);

  const select = React.useCallback(async (id: string) => {
    setActiveId(id);
    setLoading(true);
    try {
      const full = (await fetchConversation(id)) as InboxConversation;
      const preview = derivePreview(full);

      setActive(full);
      setItems((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, ...full, preview: preview ?? c.preview } : c,
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = React.useCallback((full: InboxConversation) => {
    const preview = derivePreview(full);

    setActive(full);
    setItems((prev) =>
      prev.map((c) =>
        c.id === full.id
          ? { ...c, ...full, preview: preview ?? c.preview }
          : c,
      ),
    );
  }, []);

  const loadFirstPage = React.useCallback(
    async (nextFilter: Filter) => {
      setLoading(true);
      try {
        const data = await fetchConversations({
          limit: 20,
          lite: true,
          cursor: null,
          status: nextFilter === 'ALL' ? undefined : nextFilter,
        });

        const nextItems = (Array.isArray(data.items)
          ? data.items
          : []) as InboxConversation[];

        setItems(nextItems);
        setCursor(data.nextCursor ?? null);

        const firstId = nextItems[0]?.id ?? null;
        setActiveId(firstId);
        setActive(nextItems[0] ?? null);

        if (firstId) {
          const full = (await fetchConversation(firstId)) as InboxConversation;
          setActive(full);
          setItems((prev) =>
            prev.map((c) =>
              c.id === firstId
                ? { ...c, ...full, preview: derivePreview(full) ?? c.preview }
                : c,
            ),
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // initial select
  React.useEffect(() => {
    if (!activeId) return;
    void select(activeId);
  }, [activeId, select]);

  // polling (active thread only)
  React.useEffect(() => {
    if (!activeId) return;
    const t = window.setInterval(() => void select(activeId), pollMs);
    return () => window.clearInterval(t);
  }, [activeId, select, pollMs]);

  const onFilterChange = React.useCallback(
    (nextFilter: Filter) => {
      setFilter(nextFilter);
      void loadFirstPage(nextFilter);
    },
    [loadFirstPage],
  );

  const toggleStatus = React.useCallback(
    async (id: string, next: InboxConversationStatus) => {
      setItems((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: next } : c)),
      );
      if (active?.id === id) setActive({ ...active, status: next });

      try {
        await patchConversationStatus({ conversationId: id, status: next });
        const full = (await fetchConversation(id)) as InboxConversation;
        refresh(full);
      } catch {
        try {
          const full = (await fetchConversation(id)) as InboxConversation;
          refresh(full);
        } catch {
          // ignore
        }
      }
    },
    [active, refresh],
  );

  const sortedItems = React.useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const ta = a.lastActivityAt ? Date.parse(a.lastActivityAt) : 0;
      const tb = b.lastActivityAt ? Date.parse(b.lastActivityAt) : 0;
      return tb - ta;
    });
    return copy;
  }, [items]);

  const loadMore = React.useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchConversations({
        limit: 20,
        lite: true,
        cursor,
        status: filter === 'ALL' ? undefined : filter,
      });

      const next = data.nextCursor ?? null;
      const more = (Array.isArray(data.items) ? data.items : []) as InboxConversation[];

      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        const merged = [...prev];
        for (const c of more) {
          if (c?.id && !seen.has(c.id)) merged.push(c);
        }
        return merged;
      });

      setCursor(next);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, filter]);

  return (
    <div className="h-[calc(100vh-1px)] w-full">
      <div className="grid h-full grid-cols-[360px_1fr]">
        <div className="border-r">
          <InboxList
            items={sortedItems}
            activeId={activeId}
            onSelect={select}
            onToggleStatus={toggleStatus}
            filter={filter}
            onFilterChange={onFilterChange}
          />

          <div className="p-3 border-t">
            <button
              type="button"
              className="h-9 w-full rounded-md border text-sm hover:bg-muted disabled:opacity-50"
              onClick={() => void loadMore()}
              disabled={!cursor || loadingMore}
            >
              {cursor ? (loadingMore ? 'Loading...' : 'Load more') : 'No more'}
            </button>
          </div>
        </div>

        <div className="min-w-0">
          <InboxThread conversation={active} loading={loading} onRefresh={refresh} />
        </div>
      </div>
    </div>
  );
}
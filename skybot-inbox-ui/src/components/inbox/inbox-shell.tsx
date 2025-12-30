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

function normalizeStatus(s?: string): InboxConversationStatus | undefined {
  if (s === 'OPEN' || s === 'PENDING' || s === 'CLOSED') return s;
  return undefined;
}

function computeCounts(items: InboxConversation[]) {
  let open = 0;
  let pending = 0;
  let closed = 0;

  for (const c of items) {
    const s = normalizeStatus(c.status);
    if (s === 'OPEN') open++;
    else if (s === 'PENDING') pending++;
    else if (s === 'CLOSED') closed++;
  }

  return { all: items.length, open, pending, closed };
}

export function InboxShell({
  initialItems,
  initialCursor,
}: {
  initialItems: InboxConversation[];
  initialCursor: string | null;
}) {
  const [items, setItems] = React.useState<InboxConversation[]>(initialItems);
  const [cursor, setCursor] = React.useState<string | null>(initialCursor);

  const [activeId, setActiveId] = React.useState<string | null>(
    initialItems[0]?.id ?? null,
  );
  const [active, setActive] = React.useState<InboxConversation | null>(
    initialItems[0] ?? null,
  );

  const [filter, setFilter] = React.useState<Filter>('ALL');

  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);

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

  React.useEffect(() => {
    if (!activeId) return;
    void select(activeId);
  }, [activeId, select]);

  React.useEffect(() => {
    if (!activeId) return;

    const msRaw = process.env.NEXT_PUBLIC_INBOX_POLL_MS;
    const ms = (() => {
      const n = msRaw ? Number(msRaw) : 3000;
      if (!Number.isFinite(n)) return 3000;
      return Math.min(Math.max(n, 1000), 15000);
    })();

    const t = window.setInterval(() => void select(activeId), ms);
    return () => window.clearInterval(t);
  }, [activeId, select]);

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
    const list =
      filter === 'ALL'
        ? items
        : items.filter((c) => normalizeStatus(c.status) === filter);

    const copy = [...list];
    copy.sort((a, b) => {
      const ta = a.lastActivityAt ? Date.parse(a.lastActivityAt) : 0;
      const tb = b.lastActivityAt ? Date.parse(b.lastActivityAt) : 0;
      return tb - ta;
    });
    return copy;
  }, [items, filter]);

  const counts = React.useMemo(() => computeCounts(items), [items]);

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

      const more = (
        Array.isArray(data.items) ? data.items : []
      ) as InboxConversation[];

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

  // reset pagination when changing filter
  React.useEffect(() => {
    setCursor(initialCursor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

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
            counts={counts}
            onFilterChange={(f) => setFilter(f)}
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
          <InboxThread
            conversation={active}
            loading={loading}
            onRefresh={refresh}
          />
        </div>
      </div>
    </div>
  );
}
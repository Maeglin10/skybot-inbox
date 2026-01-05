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

type Tab = InboxConversationStatus;

function derivePreview(c: InboxConversation): InboxConversation['preview'] {
  const msgs = c.messages ?? [];
  const last = msgs.length ? msgs[msgs.length - 1] : undefined;
  if (!last) return c.preview;
  return {
    text: last.text ?? null,
    timestamp: last.timestamp,
    direction: last.direction,
  };
}

function normalizeStr(x: unknown) {
  return (typeof x === 'string' ? x : '').toLowerCase().trim();
}

function matchSearch(c: InboxConversation, q: string) {
  if (!q) return true;
  const name = normalizeStr(c.contact?.name);
  const phone = normalizeStr(c.contact?.phone);
  const prev = normalizeStr(c.preview?.text);
  return name.includes(q) || phone.includes(q) || prev.includes(q);
}

export function InboxShell({
  initialItems,
  initialCursor,
  initialActiveId,
}: {
  initialItems: InboxConversation[];
  initialCursor: string | null;
  initialActiveId?: string | null;
}) {
  const [tab, setTab] = React.useState<Tab>('OPEN');

  const [byTab, setByTab] = React.useState<Record<Tab, InboxConversation[]>>({
    OPEN: [],
    PENDING: [],
    CLOSED: [],
  });

  const [cursorByTab, setCursorByTab] = React.useState<Record<Tab, string | null>>({
    OPEN: null,
    PENDING: null,
    CLOSED: null,
  });

  const [activeId, setActiveId] = React.useState<string | null>(
    initialActiveId ?? initialItems[0]?.id ?? null,
  );

  const [active, setActive] = React.useState<InboxConversation | null>(() => {
    if (!initialActiveId) return initialItems[0] ?? null;
    return initialItems.find((x) => x.id === initialActiveId) ?? null;
  });

  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const select = React.useCallback(
    async (id: string) => {
      setActiveId(id);
      setLoading(true);
      try {
        const full = (await fetchConversation(id)) as InboxConversation;
        const preview = derivePreview(full);

        setActive(full);

        setByTab((prev) => {
          const cur = prev[tab] ?? [];
          const next = cur.map((c) => (c.id === id ? { ...c, ...full, preview } : c));
          return { ...prev, [tab]: next };
        });
      } finally {
        setLoading(false);
      }
    },
    [tab],
  );

  React.useEffect(() => {
    setByTab((prev) => ({ ...prev, OPEN: initialItems }));
    setCursorByTab((prev) => ({ ...prev, OPEN: initialCursor }));

    if (initialActiveId) {
      setActiveId(initialActiveId);
      void select(initialActiveId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialItems, initialCursor, initialActiveId]);

  const cursor = cursorByTab[tab] ?? null;

  const tabItems = React.useMemo(() => {
    const raw = byTab[tab] ?? [];
    return raw.filter((c) => c.status === tab);
  }, [byTab, tab]);

  const sortedItems = React.useMemo(() => {
    const copy = [...tabItems];
    copy.sort((a, b) => {
      const ta = a.lastActivityAt ? Date.parse(a.lastActivityAt) : 0;
      const tb = b.lastActivityAt ? Date.parse(b.lastActivityAt) : 0;
      return tb - ta;
    });
    return copy;
  }, [tabItems]);

  const searchQ = React.useMemo(() => normalizeStr(search), [search]);

  const visibleItems = React.useMemo(() => {
    if (!searchQ) return sortedItems;
    return sortedItems.filter((c) => matchSearch(c, searchQ));
  }, [sortedItems, searchQ]);

  React.useEffect(() => {
    const hasAny = (byTab[tab]?.length ?? 0) > 0;
    if (hasAny) return;

    (async () => {
      try {
        const data = await fetchConversations({
          limit: 20,
          lite: true,
          status: tab,
        });

        const next =
          typeof data?.nextCursor === 'string' && data.nextCursor !== 'null'
            ? data.nextCursor
            : null;

        const more = (Array.isArray(data?.items) ? data.items : []) as InboxConversation[];

        setByTab((prev) => ({ ...prev, [tab]: more }));
        setCursorByTab((prev) => ({ ...prev, [tab]: next }));

        if (!activeId && more[0]?.id) setActiveId(more[0].id);
      } catch {
        setByTab((prev) => ({ ...prev, [tab]: [] }));
        setCursorByTab((prev) => ({ ...prev, [tab]: null }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const refresh = React.useCallback((full: InboxConversation) => {
    const preview = derivePreview(full);
    setActive(full);

    setByTab((prev) => {
      const next = { ...prev };
      (Object.keys(next) as Tab[]).forEach((t) => {
        next[t] = (next[t] ?? []).map((c) =>
          c.id === full.id ? { ...c, ...full, preview: preview ?? c.preview } : c,
        );
      });
      return next;
    });
  }, []);

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
    async (id: string, nextStatus: InboxConversationStatus) => {
      setByTab((prev) => {
        const next = { ...prev };
        (Object.keys(next) as Tab[]).forEach((t) => {
          next[t] = (next[t] ?? []).map((c) => (c.id === id ? { ...c, status: nextStatus } : c));
        });
        return next;
      });
      if (active?.id === id) setActive({ ...active, status: nextStatus });

      try {
        await patchConversationStatus({ conversationId: id, status: nextStatus });
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

  const loadMore = React.useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchConversations({
        limit: 20,
        lite: true,
        status: tab,
        cursor,
      });

      const next =
        typeof data?.nextCursor === 'string' && data.nextCursor !== 'null'
          ? data.nextCursor
          : null;

      const more = (Array.isArray(data?.items) ? data.items : []) as InboxConversation[];

      setByTab((prev) => {
        const cur = prev[tab] ?? [];
        const seen = new Set(cur.map((x) => x.id));
        const merged = [...cur];
        for (const c of more) {
          if (c?.id && !seen.has(c.id)) merged.push(c);
        }
        return { ...prev, [tab]: merged };
      });

      setCursorByTab((prev) => ({ ...prev, [tab]: next }));
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, tab]);

  const TabBtn = ({ v, label }: { v: Tab; label: string }) => (
    <button
      type="button"
      onClick={() => setTab(v)}
      className={[
        'h-9 rounded-md border border-white/10 px-3 text-xs text-white/80',
        tab === v ? 'bg-white/10' : 'bg-black/30 hover:bg-white/10',
      ].join(' ')}
    >
      {label}
    </button>
  );

  return (
    <div className="h-[calc(100vh-1px)] w-full bg-black">
      <div className="grid h-full grid-cols-[380px_minmax(0,1fr)]">
        <div className="border-r border-white/10 flex flex-col">
          <div className="sticky top-0 z-10 border-b border-white/10 bg-black/70 backdrop-blur">
            <div className="p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-white/90">Inbox</div>
                <div className="text-xs text-white/50">
                  {tab === 'OPEN' ? 'Open' : tab === 'PENDING' ? 'Pending' : 'Closed'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TabBtn v="OPEN" label="Open" />
                <TabBtn v="PENDING" label="Pending" />
                <TabBtn v="CLOSED" label="Closed" />
              </div>
            </div>

            <div className="p-3 border-t border-white/10">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/15"
                placeholder="Search name / phone / preview…"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0">
            {visibleItems.length === 0 ? (
              <div className="p-6 text-sm text-white/50">No conversations.</div>
            ) : (
              <InboxList
                items={visibleItems}
                activeId={activeId}
                onSelect={select}
                onToggleStatus={toggleStatus}
              />
            )}
          </div>

          <div className="p-3 border-t border-white/10">
            <button
              type="button"
              className="h-9 w-full rounded-md border border-white/10 bg-white/5 text-sm text-white hover:bg-white/10 disabled:opacity-50"
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
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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

function clampPollMs(raw: string | undefined) {
  const n = raw ? Number(raw) : 3000;
  if (!Number.isFinite(n)) return 3000;
  return Math.min(Math.max(n, 1500), 15000);
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
  const router = useRouter();

  const [tab, setTab] = React.useState<Tab>('OPEN');

  const [byTab, setByTab] = React.useState<Record<Tab, InboxConversation[]>>({
    OPEN: [],
    PENDING: [],
    CLOSED: [],
  });

  const [cursorByTab, setCursorByTab] = React.useState<
    Record<Tab, string | null>
  >({
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

  // ---- core select (NO router) for polling/refresh
  const selectCore = React.useCallback(
    async (id: string) => {
      setActiveId(id);
      setLoading(true);
      try {
        const full = (await fetchConversation(id)) as InboxConversation;
        const preview = derivePreview(full);

        setActive(full);

        setByTab((prev) => {
          const cur = prev[tab] ?? [];
          const next = cur.map((c) =>
            c.id === id ? { ...c, ...full, preview } : c,
          );
          return { ...prev, [tab]: next };
        });
      } finally {
        setLoading(false);
      }
    },
    [tab],
  );

  // ---- user select (router + core)
  const selectUser = React.useCallback(
    (id: string) => {
      router.push(`/inbox/${id}`, { scroll: false });
      void selectCore(id);
    },
    [router, selectCore],
  );

  // Bootstrap OPEN tab list + cursor
  React.useEffect(() => {
    setByTab((prev) => ({ ...prev, OPEN: initialItems }));
    setCursorByTab((prev) => ({ ...prev, OPEN: initialCursor }));
  }, [initialItems, initialCursor]);

  // If route gives an initialActiveId, load it once without pushing route again
  React.useEffect(() => {
    if (!initialActiveId) return;
    setActiveId(initialActiveId);
    void selectCore(initialActiveId);
  }, [initialActiveId, selectCore]);

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

  // Lazy-load per tab (only once when empty)
  React.useEffect(() => {
    const hasAny = (byTab[tab]?.length ?? 0) > 0;
    if (hasAny) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await fetchConversations({
          limit: 20,
          lite: true,
          status: tab,
        });

        if (cancelled) return;

        const next =
          typeof data?.nextCursor === 'string' && data.nextCursor !== 'null'
            ? data.nextCursor
            : null;

        const more = (
          Array.isArray(data?.items) ? data.items : []
        ) as InboxConversation[];

        setByTab((prev) => ({ ...prev, [tab]: more }));
        setCursorByTab((prev) => ({ ...prev, [tab]: next }));

        if (!activeId && more[0]?.id) setActiveId(more[0].id);
      } catch {
        if (cancelled) return;
        setByTab((prev) => ({ ...prev, [tab]: [] }));
        setCursorByTab((prev) => ({ ...prev, [tab]: null }));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const refresh = React.useCallback((full: InboxConversation) => {
    const preview = derivePreview(full);
    setActive(full);

    setByTab((prev) => {
      const next = { ...prev };
      (Object.keys(next) as Tab[]).forEach((t) => {
        next[t] = (next[t] ?? []).map((c) =>
          c.id === full.id
            ? { ...c, ...full, preview: preview ?? c.preview }
            : c,
        );
      });
      return next;
    });
  }, []);

  // Single polling effect: refresh active conversation without route changes.
  React.useEffect(() => {
    if (!activeId) return;

    const ms = clampPollMs(process.env.NEXT_PUBLIC_INBOX_POLL_MS);

    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      if (
        typeof document !== 'undefined' &&
        document.visibilityState !== 'visible'
      )
        return;
      await selectCore(activeId);
    };

    const t = window.setInterval(() => void tick(), ms);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [activeId, selectCore]);

  const toggleStatus = React.useCallback(
    async (id: string, nextStatus: InboxConversationStatus) => {
      setByTab((prev) => {
        const next = { ...prev };
        (Object.keys(next) as Tab[]).forEach((t) => {
          next[t] = (next[t] ?? []).map((c) =>
            c.id === id ? { ...c, status: nextStatus } : c,
          );
        });
        return next;
      });

      if (active?.id === id) setActive({ ...active, status: nextStatus });

      try {
        await patchConversationStatus({
          conversationId: id,
          status: nextStatus,
        });
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

      const more = (
        Array.isArray(data?.items) ? data.items : []
      ) as InboxConversation[];

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
        'h-9 rounded-md border border-border px-3 text-xs',
        tab === v
          ? 'bg-muted text-foreground'
          : 'bg-background hover:bg-muted/50 text-muted-foreground',
      ].join(' ')}
    >
      {label}
    </button>
  );

  return (
  <div className="h-[calc(100vh-1px)] w-full bg-transparent text-foreground">
    <div className="grid h-full grid-cols-[380px_minmax(0,1fr)]">
      <div className="border-r border-border/20 flex flex-col">
        <div className="sticky top-0 z-10 border-b border-border/20 bg-background/80 backdrop-blur">
          <div className="px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-base font-semibold">Inbox</div>
              <div className="text-xs text-muted-foreground">
                {tab === 'OPEN' ? 'Open' : tab === 'PENDING' ? 'Pending' : 'Closed'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TabBtn v="OPEN" label="Open" />
              <TabBtn v="PENDING" label="Pending" />
              <TabBtn v="CLOSED" label="Closed" />
            </div>
          </div>

          <div className="px-4 pb-4 border-t border-border/20">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-4 h-9 w-full rounded-md border border-border/20 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/.35)]"
              placeholder="Search name / phone / preview…"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {visibleItems.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No conversations.</div>
          ) : (
            <InboxList
              items={visibleItems}
              activeId={activeId}
              onSelect={selectUser}
              onToggleStatus={toggleStatus}
            />
          )}
        </div>

        <div className="p-4 border-t border-border/20">
          <button
            type="button"
            className="h-9 w-full rounded-md border border-border/20 bg-muted/40 text-sm text-foreground hover:bg-muted disabled:opacity-50"
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

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
}: {
  initialItems: InboxConversation[];
  initialCursor: string | null;
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
    initialItems[0]?.id ?? null,
  );
  const [active, setActive] = React.useState<InboxConversation | null>(
    initialItems[0] ?? null,
  );

  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);

  React.useEffect(() => {
    setByTab((prev) => ({ ...prev, OPEN: initialItems }));
    setCursorByTab((prev) => ({ ...prev, OPEN: initialCursor }));
  }, [initialItems, initialCursor]);

  const cursor = cursorByTab[tab] ?? null;

  const tabItems = React.useMemo(() => {
    const raw = byTab[tab] ?? [];
    // IMPORTANT: strict filter to keep each tab correct after status changes
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
        'h-9 rounded-md border px-3 text-xs',
        tab === v ? 'bg-muted' : 'bg-background hover:bg-muted/50',
      ].join(' ')}
    >
      {label}
    </button>
  );

  return (
    <div className="h-[calc(100vh-1px)] w-full">
      <div className="grid h-full grid-cols-[380px_1fr]">
        <div className="border-r flex flex-col">
          <div className="p-3 border-b flex items-center gap-2">
            <TabBtn v="OPEN" label="Open" />
            <TabBtn v="PENDING" label="Pending" />
            <TabBtn v="CLOSED" label="Closed" />
          </div>

          <div className="p-3 border-b">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md border px-3 text-sm"
              placeholder="Search name / phone / preview…"
            />
          </div>

          <div className="flex-1 min-h-0">
            <InboxList
              items={visibleItems}
              activeId={activeId}
              onSelect={select}
              onToggleStatus={toggleStatus}
            />
          </div>

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
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

// Mock data for demo purposes when API fails or is empty
const MOCK_CONVERSATIONS: InboxConversation[] = [
  {
    id: "demo-1",
    status: "OPEN",
    contact: { name: "Alice Johnson", phone: "+1 555 0123" },
    lastActivityAt: new Date().toISOString(),
    preview: { text: "Hey, I'm interested in your premium plan.", timestamp: new Date().toISOString(), direction: "IN" },
    messages: [
       { text: "Hey, I'm interested in your premium plan.", timestamp: new Date().toISOString(), direction: "IN" }
    ]
  },
  {
    id: "demo-2",
    status: "OPEN",
    contact: { name: "Bob Smith", phone: "+1 555 0456" },
    lastActivityAt: new Date(Date.now() - 3600000).toISOString(),
    preview: { text: "Can you help me with my invoice?", timestamp: new Date(Date.now() - 3600000).toISOString(), direction: "IN" },
    messages: [
       { text: "Can you help me with my invoice?", timestamp: new Date(Date.now() - 3600000).toISOString(), direction: "IN" }
    ]
  }
];

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

  // Use mock data if initialItems empty (Demo Mode)
  // In real prod, remove this || MOCK... logic if not desired.
  // The user requested: "Si données mock/demo présentes → afficher conversations."
  const effectiveInitialItems = initialItems.length > 0 ? initialItems : MOCK_CONVERSATIONS;

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
    initialActiveId ?? effectiveInitialItems[0]?.id ?? null,
  );

  const [active, setActive] = React.useState<InboxConversation | null>(() => {
    if (!initialActiveId) return effectiveInitialItems[0] ?? null;
    return effectiveInitialItems.find((x) => x.id === initialActiveId) ?? null;
  });

  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);

  // ---- core select (NO router) for polling/refresh
  const selectCore = React.useCallback(
    async (id: string) => {
      setActiveId(id);
      
      // If it's a mock conversation, don't fetch from API
      const isMock = id.startsWith('demo-');
      if(isMock) {
         const found = MOCK_CONVERSATIONS.find(c => c.id === id);
         if(found) setActive(found);
         return;
      }

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
      // In next-intl or app router, we might want to keep URL clean or append. 
      // For now, simpler to just keep client state or use shallow routing if possible.
      // router.push(`/inbox/${id}`, { scroll: false }); 
      void selectCore(id);
    },
    [router, selectCore],
  );

  // Bootstrap OPEN tab list + cursor
  React.useEffect(() => {
    setByTab((prev) => ({ ...prev, OPEN: effectiveInitialItems }));
    setCursorByTab((prev) => ({ ...prev, OPEN: initialCursor }));
  }, [effectiveInitialItems, initialCursor]);

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
    
    // Auto-fill mock data for other tabs if empty and we are using mocks in OPEN
    const usingMocks = effectiveInitialItems === MOCK_CONVERSATIONS;
    if (usingMocks && !hasAny) {
       // Just duplicate mocks for other tabs for demo feel? Or leave empty. 
       // Start empty for other tabs to test "empty state" logic
       return; 
    }

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
    if (activeId.startsWith('demo-')) return; // No poll for mocks

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
      
      const isMock = id.startsWith('demo-');

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

      if (isMock) return; // Stop if mock

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
        'h-9 w-full rounded-md border border-border/20 px-3 text-xs',
        tab === v
          ? 'bg-muted text-foreground'
          : 'bg-background text-muted-foreground',
      ].join(' ')}
    >
      {label}
    </button>
  );

  return (
    <div className="h-[calc(100vh-1px)] w-full bg-transparent text-foreground">
      <div className="grid h-full grid-cols-[380px_minmax(0,1fr)]">
        <div className="border-r border-border/20 flex flex-col">
          <div className="ui-inboxHeader">
            <div className="ui-inboxHeader__top">
              <div className="ui-inboxHeader__title font-bold text-lg">Inbox</div>
              <div className="ui-inboxHeader__state text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/10">
                {tab === 'OPEN'
                  ? 'Open'
                  : tab === 'PENDING'
                    ? 'Pending'
                    : 'Closed'}
              </div>
            </div>

            <div className="ui-inboxHeader__tabs">
              <TabBtn v="OPEN" label="Open" />
              <TabBtn v="PENDING" label="Pending" />
              <TabBtn v="CLOSED" label="Closed" />
            </div>

            <div className="ui-inboxHeader__search">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ui-input"
                placeholder="Search messages..."
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 bg-background/50">
            {visibleItems.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center h-48 space-y-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center opacity-50">
                   <Inbox size={24} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground">New messages will appear here.</p>
              </div>
            ) : (
              <InboxList
                items={visibleItems}
                activeId={activeId}
                onSelect={selectUser}
                onToggleStatus={toggleStatus}
              />
            )}
          </div>

          <div className="p-4 border-t border-border/20 bg-background/50 backdrop-blur-sm">
            <button
              type="button"
              className="ui-btn w-full flex justify-center text-xs"
              onClick={() => void loadMore()}
              disabled={!cursor || loadingMore}
            >
              {cursor ? (loadingMore ? 'Loading...' : 'Load older messages') : 'All messages loaded'}
            </button>
          </div>
        </div>

        <div className="min-w-0 bg-background">
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

// Simple Icon component helper if Inbox not imported from lucide-react yet in scope
function Inbox({size, className}: {size: number, className: string}) {
   return (
     <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
       <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
       <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
     </svg>
   )
}

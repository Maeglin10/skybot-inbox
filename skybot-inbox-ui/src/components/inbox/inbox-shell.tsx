'use client';

import * as React from 'react';
import { InboxList } from './list';
import { InboxThread } from './thread';
import { fetchConversation, fetchConversations } from '@/lib/inbox.client';
import { patchConversationStatus } from '@/lib/status.client';

export type InboxConversationStatus = 'OPEN' | 'CLOSED';

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

function mergeLiteIntoItems(
  prev: InboxConversation[],
  incoming: InboxConversation[],
): InboxConversation[] {
  const byId = new Map(prev.map((c) => [c.id, c]));

  for (const lite of incoming) {
    if (!lite?.id) continue;

    const old = byId.get(lite.id);
    if (!old) {
      byId.set(lite.id, lite);
      continue;
    }

    // merge uniquement "lite", ne touche pas messages
    byId.set(lite.id, {
      ...old,
      status: lite.status ?? old.status,
      lastActivityAt: lite.lastActivityAt ?? old.lastActivityAt,
      contact: lite.contact ?? old.contact,
      preview: lite.preview ?? old.preview,
    });
  }

  return Array.from(byId.values());
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

  // Poll lite: refresh la colonne gauche sans écraser messages
  const pollingRef = React.useRef(false);
  React.useEffect(() => {
    let t: ReturnType<typeof setInterval> | null = null;

    async function pollLite() {
      if (pollingRef.current) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

      pollingRef.current = true;
      try {
        const data = await fetchConversations({ limit: 50, lite: true });
        const nextItems = (Array.isArray(data.items) ? data.items : []) as InboxConversation[];

        setItems((prev) => mergeLiteIntoItems(prev, nextItems));

        // ne remplace pas un cursor existant; initialise juste si null
        setCursor((cur) => cur ?? (data.nextCursor ?? null));
      } finally {
        pollingRef.current = false;
      }
    }

    void pollLite();
    t = setInterval(() => void pollLite(), 5000);

    return () => {
      if (t) clearInterval(t);
    };
  }, []);

  async function toggleStatus(id: string, next: 'OPEN' | 'CLOSED') {
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
  }

  const sortedItems = React.useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const ta = a.lastActivityAt ? Date.parse(a.lastActivityAt) : 0;
      const tb = b.lastActivityAt ? Date.parse(b.lastActivityAt) : 0;
      return tb - ta;
    });
    return copy;
  }, [items]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchConversations({ limit: 20, lite: true, cursor });
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
  }

  return (
    <div className="h-[calc(100vh-1px)] w-full">
      <div className="grid h-full grid-cols-[360px_1fr]">
        <div className="border-r">
          <InboxList
            items={sortedItems}
            activeId={activeId}
            onSelect={select}
            onToggleStatus={toggleStatus}
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
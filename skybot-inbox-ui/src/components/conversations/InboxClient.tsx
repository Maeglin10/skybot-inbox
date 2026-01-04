"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiGetClient } from "@/lib/api.client";

type Status = "OPEN" | "PENDING" | "CLOSED";

type ConvItem = {
  id: string;
  status: Status;
  lastActivityAt?: string | null;
  updatedAt: string;
  contact?: { name?: string | null; phone?: string | null } | null;
  messages?: { text?: string | null }[] | null;
  preview?: { text?: string | null } | null;
};

function formatTs(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function InboxClient(props: {
  initialItems: ConvItem[];
  initialCursor: string | null;
}) {
  const params = useParams<{ id?: string }>();
  const selectedId = params?.id;

  const [items, setItems] = useState<ConvItem[]>(props.initialItems);
  const [cursor, setCursor] = useState<string | null>(props.initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const ta = new Date(a.lastActivityAt ?? a.updatedAt).getTime();
      const tb = new Date(b.lastActivityAt ?? b.updatedAt).getTime();
      return tb - ta;
    });
  }, [items]);

  async function loadMore() {
  if (!cursor || loadingMore) return;
  setLoadingMore(true);
  setError(null);

  try {
    const data = await apiGetClient(
      `/conversations?limit=50&cursor=${encodeURIComponent(cursor)}&lite=1`
    );

    const nextItems: ConvItem[] = data?.items ?? [];
    const nextCursor: string | null = data?.nextCursor ?? null;

    setItems((prev) => [...prev, ...nextItems]);
    setCursor(nextCursor);
  } catch (e) {
    setError(e instanceof Error ? e.message : "Load more failed");
  } finally {
    setLoadingMore(false);
  }
}

  return (
    <div className="rounded-xl border border-white/10 bg-black/40">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-sm text-white/70">
        <div>Inbox</div>
        <Link href="/inbox" className="text-xs text-white/50 hover:text-white/70">
          Refresh
        </Link>
      </div>

      <div className="max-h-[72vh] overflow-auto">
        {sorted.length === 0 ? (
          <div className="p-4 text-sm text-white/50">No conversations</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {sorted.map((c) => {
              const title =
                c.contact?.name?.trim() || c.contact?.phone?.trim() || c.id;

              const preview =
                c.preview?.text?.trim() ||
                c.messages?.at(-1)?.text?.trim() ||
                "";

              const ts = formatTs(c.lastActivityAt ?? c.updatedAt);
              const active = selectedId === c.id;

              return (
                <li key={c.id}>
                  <Link
                    href={`/inbox/${c.id}`}
                    className={[
                      "block px-3 py-3",
                      active ? "bg-white/10" : "hover:bg-white/5",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm text-white/90">
                          {title}
                        </div>
                        <div className="truncate text-xs text-white/50">
                          {preview}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] text-white/50">{ts}</span>
                        <span className="rounded border border-white/10 px-2 py-0.5 text-[11px] text-white/70">
                          {c.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-white/10 p-3">
        {error && <div className="mb-2 text-xs text-amber-300">{error}</div>}
        <button
          type="button"
          className="w-full rounded border border-white/10 px-3 py-2 text-sm text-white/80 disabled:opacity-50"
          onClick={loadMore}
          disabled={!cursor || loadingMore}
        >
          {loadingMore ? "Loading…" : cursor ? "Load more" : "No more"}
        </button>
      </div>
    </div>
  );
}
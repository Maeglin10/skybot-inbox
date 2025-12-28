// skybot-inbox-ui/src/components/inbox/list.tsx
"use client";

import * as React from "react";
import type { InboxConversation } from "./inbox-shell";

function previewText(c: InboxConversation) {
  const p = c.preview?.text;
  if (typeof p === 'string') return p.slice(0, 80);
  if (p == null) return '';
  return String(p).slice(0, 80);
}

function pillClass(status?: InboxConversation["status"]) {
  if (status === "OPEN")
    return "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (status === "CLOSED")
    return "border-zinc-400/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300";
  return "border-zinc-400/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300";
}

export function InboxList({
  items,
  activeId,
  onSelect,
}: {
  items: InboxConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="h-full">
      <div className="p-4 border-b">
        <div className="text-sm font-semibold">Conversations</div>
        <div className="text-xs text-muted-foreground">{items.length} total</div>
      </div>

      <div className="h-[calc(100%-57px)] overflow-auto">
        {items.map((c) => {
          const name = c.contact?.name || c.contact?.phone || "Unknown";
          const phone = c.contact?.phone || "";
          const isActive = c.id === activeId;

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className={[
                "w-full text-left px-4 py-3 border-b hover:bg-muted/50",
                isActive ? "bg-muted" : "bg-background",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{name}</div>
                  <div className="truncate text-xs text-muted-foreground">{phone}</div>
                </div>

                <div
                  className={[
                    "shrink-0 text-[10px] rounded px-2 py-1 border",
                    pillClass(c.status),
                  ].join(" ")}
                  title="Status"
                >
                  {c.status ?? "—"}
                </div>
              </div>

              <div className="mt-2 truncate text-xs text-muted-foreground">
                {previewText(c)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
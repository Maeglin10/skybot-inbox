"use client";

import * as React from "react";
import type { InboxConversation } from "./inbox-shell";

function previewText(c: InboxConversation) {
  const msg = c.messages?.[c.messages.length - 1]?.text ?? c.messages?.[0]?.text ?? "";
  return (msg || "").slice(0, 80);
}

function pillClass(status?: string) {
  if (status === "OPEN") return "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (status === "CLOSED") return "border-zinc-400/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300";
  return "border-zinc-400/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300";
}

function fmt(ts?: string) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString(undefined, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function InboxList({
  items,
  activeId,
  onSelect,
  onToggleStatus,
}: {
  items: InboxConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onToggleStatus?: (id: string, next: "OPEN" | "CLOSED") => void;
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
          const status = c.status ?? "—";
          const next = c.status === "OPEN" ? "CLOSED" : "OPEN";

          return (
            <div
              key={c.id}
              className={[
                "border-b",
                isActive ? "bg-muted" : "bg-background",
              ].join(" ")}
            >
              <button
                onClick={() => onSelect(c.id)}
                className="w-full text-left px-4 py-3 hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{name}</div>
                    <div className="truncate text-xs text-muted-foreground">{phone}</div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <div
                      className={[
                        "text-[10px] rounded px-2 py-1 border",
                        pillClass(c.status),
                      ].join(" ")}
                      title="Status"
                    >
                      {status}
                    </div>
                  </div>
                </div>

                <div className="mt-2 truncate text-xs text-muted-foreground">
                  {previewText(c)}
                </div>
              </button>

              {onToggleStatus ? (
                <div className="px-4 pb-3">
                  <button
                    type="button"
                    className="h-8 rounded-md border px-3 text-xs hover:bg-muted disabled:opacity-50"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleStatus(c.id, next);
                    }}
                    disabled={!c.id}
                  >
                    Set {next}
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import type { InboxConversation } from "./inbox-shell";

function previewText(c: InboxConversation) {
  const t = c.preview?.text ?? c.messages?.[c.messages.length - 1]?.text ?? "";
  return (t || "").slice(0, 80);
}

function statusMeta(status?: string) {
  if (status === "OPEN") {
    return {
      label: "OPEN",
      pill:
        "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      dot: "bg-emerald-500",
    };
  }
  if (status === "CLOSED") {
    return {
      label: "CLOSED",
      pill:
        "border-zinc-400/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
      dot: "bg-zinc-400",
    };
  }
  return {
    label: status ?? "—",
    pill: "border-zinc-400/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
    dot: "bg-zinc-400",
  };
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

          const meta = statusMeta(c.status);
          const next = c.status === "OPEN" ? "CLOSED" : "OPEN";

          return (
            <div
              key={c.id}
              className={["border-b", isActive ? "bg-muted" : "bg-background"].join(" ")}
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
                        "inline-flex items-center gap-2 text-[10px] rounded px-2 py-1 border",
                        meta.pill,
                      ].join(" ")}
                      title="Status"
                    >
                      <span className={["h-2 w-2 rounded-full", meta.dot].join(" ")} />
                      <span>{meta.label}</span>
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
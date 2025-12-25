"use client";

import * as React from "react";
import type { InboxConversation } from "./inbox-shell";
import { sendMessage } from "@/lib/messages.client";
import { fetchConversation } from "@/lib/inbox.client";
import { patchConversationStatus } from "@/lib/status.client";

type Msg = {
  text?: string | null;
  timestamp?: string;
  direction?: "IN" | "OUT";
};

function fmt(ts?: string) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function InboxThread({
  conversation,
  loading,
  onRefresh,
}: {
  conversation: InboxConversation | null;
  loading?: boolean;
  onRefresh?: (full: InboxConversation) => void;
}) {
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  const conversationId = conversation?.id ?? null;
  const name = conversation?.contact?.name || conversation?.contact?.phone || "Unknown";
  const phone = conversation?.contact?.phone || "";
  const messages: Msg[] = (conversation?.messages ?? []) as Msg[];

  const currentStatus = (conversation?.status ?? "OPEN") as "OPEN" | "CLOSED";
  const nextStatus: "OPEN" | "CLOSED" = currentStatus === "OPEN" ? "CLOSED" : "OPEN";

  function scrollToBottom(behavior: ScrollBehavior = "auto") {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }

  React.useEffect(() => {
    if (!conversationId) return;
    scrollToBottom();
  }, [conversationId, messages.length]);

  async function refreshFromServer(id: string) {
    const full = (await fetchConversation(id)) as InboxConversation;
    onRefresh?.(full);
    return full;
  }

  async function toggleStatus() {
    if (!conversationId || sending || !conversation) return;

    setError(null);
    setSending(true);

    // optimistic d’abord
    onRefresh?.({
      ...conversation,
      status: nextStatus,
      lastActivityAt: new Date().toISOString(),
    });

    try {
      await patchConversationStatus({ conversationId, status: nextStatus });
      await refreshFromServer(conversationId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Status update failed");
      try {
        await refreshFromServer(conversationId);
      } catch {
        // ignore
      }
    } finally {
      setSending(false);
    }
  }

  async function handleSend() {
    const t = text.trim();
    if (!t || !phone || !conversationId || sending || !conversation) return;

    setError(null);
    setSending(true);

    const optimistic: Msg = {
      text: t,
      direction: "OUT",
      timestamp: new Date().toISOString(),
    };

    onRefresh?.({
      ...conversation,
      lastActivityAt: new Date().toISOString(),
      messages: [...(conversation.messages ?? []), optimistic],
    });

    setText("");
    scrollToBottom("smooth");

    try {
      await sendMessage({ conversationId, to: phone, text: t });
      await refreshFromServer(conversationId);
      scrollToBottom("smooth");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Send failed");
      try {
        await refreshFromServer(conversationId);
      } catch {
        // ignore
      }
    } finally {
      setSending(false);
    }
  }

  if (!conversationId || !conversation) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Sélectionne une conversation
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{name}</div>
          <div className="text-xs text-muted-foreground truncate">{phone}</div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] rounded px-2 py-1 border">
              {currentStatus}
            </span>

            <button
              type="button"
              className="h-8 rounded-md border px-3 text-xs hover:bg-muted disabled:opacity-50"
              disabled={sending}
              onClick={() => void toggleStatus()}
            >
              {currentStatus === "OPEN" ? "Close" : "Reopen"}
            </button>
          </div>

          {error ? <div className="mt-2 text-xs text-red-500 truncate">{error}</div> : null}
        </div>

        <div className="shrink-0 text-xs text-muted-foreground">
          {loading ? "Loading…" : sending ? "Working…" : null}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((m, idx) => {
          const dir = m.direction ?? "IN";
          const isOut = dir === "OUT";

          return (
            <div key={idx} className={["flex", isOut ? "justify-end" : "justify-start"].join(" ")}>
              <div
                className={[
                  "max-w-[720px] rounded-lg border px-3 py-2 text-sm",
                  isOut ? "bg-muted" : "bg-background",
                ].join(" ")}
              >
                <div className="whitespace-pre-wrap break-words">{m.text ?? ""}</div>
                {m.timestamp ? (
                  <div className="mt-1 text-[10px] text-muted-foreground">{fmt(m.timestamp)}</div>
                ) : null}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message…"
          className="flex-1 h-10 rounded-md border bg-background px-3 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) void handleSend();
          }}
        />
        <button
          type="button"
          className="h-10 rounded-md border px-4 text-sm hover:bg-muted disabled:opacity-50"
          disabled={sending || !text.trim() || !phone}
          onClick={() => void handleSend()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
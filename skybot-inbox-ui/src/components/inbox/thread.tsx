"use client";

import * as React from "react";
import type { InboxConversation } from "./inbox-shell";
import { sendMessage } from "@/lib/messages.client";
import { fetchConversation } from "@/lib/inbox.client";

type Msg = {
  text?: string | null;
  timestamp?: string;
  direction?: "IN" | "OUT";
};

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

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  React.useEffect(() => {
    if (!conversationId) return;
    scrollToBottom();
  }, [conversationId, messages.length]);

  async function handleSend() {
    const t = text.trim();
    if (!t || !phone || !conversationId || sending) return;

    setError(null);
    setSending(true);

    const optimistic: Msg = {
      text: t,
      direction: "OUT",
      timestamp: new Date().toISOString(),
    };

    const optimisticConv: InboxConversation = {
      id: conversationId,
      status: conversation?.status,
      contact: conversation?.contact,
      lastActivityAt: conversation?.lastActivityAt,
      messages: [...(conversation?.messages ?? []), optimistic],
    };

    onRefresh?.(optimisticConv);
    setText("");
    scrollToBottom();

    try {
      await sendMessage({
        conversationId,
        to: phone,
        text: t,
      });

      const full = (await fetchConversation(conversationId)) as InboxConversation;
      onRefresh?.(full);
      scrollToBottom();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Send failed");
      try {
        const full = (await fetchConversation(conversationId)) as InboxConversation;
        onRefresh?.(full);
      } catch {
        // ignore
      }
    } finally {
      setSending(false);
    }
  }

  if (!conversationId) {
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
          {error ? <div className="mt-2 text-xs text-red-500 truncate">{error}</div> : null}
        </div>
        <div className="shrink-0 text-xs text-muted-foreground">
          {loading ? "Loading…" : sending ? "Sending…" : null}
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
                  "max-w-[720px] rounded-lg border p-3",
                  isOut ? "bg-muted" : "bg-background",
                ].join(" ")}
              >
                <div className="text-sm whitespace-pre-wrap">{m.text ?? ""}</div>
                {m.timestamp ? (
                  <div className="mt-1 text-[10px] text-muted-foreground">{m.timestamp}</div>
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

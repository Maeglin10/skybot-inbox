"use client";

import * as React from "react";
import type { InboxConversation } from "./inbox-shell";

export function InboxThread({
  conversation,
  loading,
}: {
  conversation: InboxConversation | null;
  loading?: boolean;
}) {
  const [text, setText] = React.useState("");

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Sélectionne une conversation
      </div>
    );
  }

  const name = conversation.contact?.name || conversation.contact?.phone || "Unknown";
  const phone = conversation.contact?.phone || "";

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{name}</div>
          <div className="text-xs text-muted-foreground">{phone}</div>
        </div>
        {loading ? <div className="text-xs text-muted-foreground">Loading…</div> : null}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {(conversation.messages ?? []).slice().reverse().map((m, idx) => (
          <div key={idx} className="max-w-[720px] rounded-lg border p-3">
            <div className="text-sm">{m.text ?? ""}</div>
            {m.timestamp ? (
              <div className="mt-1 text-[10px] text-muted-foreground">{m.timestamp}</div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="border-t p-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message…"
          className="flex-1 h-10 rounded-md border bg-background px-3 text-sm"
        />
        <button
          type="button"
          className="h-10 rounded-md border px-4 text-sm hover:bg-muted"
          onClick={() => setText("")}
        >
          Send
        </button>
      </div>
    </div>
  );
}

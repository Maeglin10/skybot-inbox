"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  conversationId: string;
};

export default function Composer({ conversationId }: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = text.trim().length > 0 && !loading;

  async function onSend() {
    if (!canSend) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!res.ok) {
        const payload = await safeJson(res);
        throw new Error(payload?.error ?? `HTTP ${res.status}`);
      }

      setText("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded border p-3 space-y-2">
      <div className="text-sm font-medium">Reply</div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded border px-3 py-2 text-sm"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />

        <button
          type="button"
          className="rounded border px-3 py-2 text-sm"
          onClick={onSend}
          disabled={!canSend}
        >
          {loading ? "Sending…" : "Send"}
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
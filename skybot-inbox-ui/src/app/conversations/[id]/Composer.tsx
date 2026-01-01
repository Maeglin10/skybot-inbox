"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Composer(props: { conversationId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const payload = { text: text.trim() };
    if (!payload.text) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${props.conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setText("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <input
        className="flex-1 border rounded px-3 py-2"
        placeholder="Type a message…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
        }}
        disabled={loading}
      />
      <button
        className="nx-btn nx-btn--primary"
        onClick={send}
        disabled={loading || !text.trim()}
      >
        Send
      </button>
    </div>
  );
}
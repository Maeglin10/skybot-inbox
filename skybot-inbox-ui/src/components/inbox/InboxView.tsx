"use client";

import { useMemo, useState } from "react";
import { messages, threads } from "@/lib/mock/inbox";

export default function InboxView() {
  const [activeId, setActiveId] = useState(threads[0]?.id ?? "");

  const thread = useMemo(() => threads.find(t => t.id === activeId), [activeId]);
  const threadMessages = useMemo(() => messages.filter(m => m.threadId === activeId), [activeId]);

  return (
    <div className="nx-shell">
      <aside className="nx-sidebar">
        <div className="nx-sidebar__header">Inbox</div>
        <div className="nx-threadlist">
          {threads.map(t => (
            <button
              key={t.id}
              className={`nx-thread ${t.id === activeId ? "is-active" : ""}`}
              onClick={() => setActiveId(t.id)}
              type="button"
            >
              <div className="nx-thread__top">
                <div className="nx-thread__title">{t.title}</div>
                {t.unread > 0 && <span className="nx-badge">{t.unread}</span>}
              </div>
              <div className="nx-thread__meta">{t.channel} • {new Date(t.updatedAt).toLocaleTimeString()}</div>
              <div className="nx-thread__last">{t.lastMessage}</div>
            </button>
          ))}
        </div>
      </aside>

      <main className="nx-main">
        <div className="nx-main__header">
          <div className="nx-main__title">{thread?.title ?? "—"}</div>
          <div className="nx-main__meta">{thread?.channel ?? ""}</div>
        </div>

        <div className="nx-messages">
          {threadMessages.map(m => (
            <div key={m.id} className={`nx-msg ${m.role === "agent" ? "is-agent" : "is-user"}`}>
              <div className="nx-msg__bubble">{m.text}</div>
              <div className="nx-msg__time">{new Date(m.createdAt).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>

        <div className="nx-composer">
          <input className="nx-input" placeholder="Écrire un message (mock)" />
          <button className="nx-btn" type="button">Send</button>
        </div>
      </main>
    </div>
  );
}
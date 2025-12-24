'use client';

import * as React from 'react';

type Conversation = {
  id: string;
  status: string;
  lastActivityAt?: string;
  contact?: { name?: string | null; phone?: string | null };
};

export function ConversationList({
  items,
  selectedId,
  onSelect,
}: {
  items: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="border-r h-dvh overflow-auto">
      <div className="p-3 border-b">
        <div className="text-sm font-semibold">Conversations</div>
        <div className="text-xs text-muted-foreground">{items.length} items</div>
      </div>

      <ul className="p-2 space-y-1">
        {items.map((c) => {
          const name = c.contact?.name ?? c.contact?.phone ?? 'Unknown';
          const active = c.id === selectedId;
          return (
            <li key={c.id}>
              <button
                className={[
                  'w-full text-left rounded-md px-3 py-2 border',
                  active ? 'bg-muted' : 'hover:bg-muted/60',
                ].join(' ')}
                onClick={() => onSelect(c.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium truncate">{name}</div>
                  <div className="text-[11px] px-2 py-0.5 rounded-full border">
                    {c.status}
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground truncate">
                  {c.id}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
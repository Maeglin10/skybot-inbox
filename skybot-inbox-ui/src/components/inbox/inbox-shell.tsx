'use client';

import * as React from 'react';
import { apiGetClient } from '@/lib/api.client';
import { ConversationList } from './list';
import { Thread } from './thread';

type Conversation = {
  id: string;
  status: string;
  lastActivityAt?: string;
  contact?: { name?: string | null; phone?: string | null };
};

export function InboxShell({ initialItems }: { initialItems: Conversation[] }) {
  const [items, setItems] = React.useState<Conversation[]>(initialItems);
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialItems?.[0]?.id ?? null,
  );

  // refresh léger (poll)
  React.useEffect(() => {
    const t = setInterval(async () => {
      try {
        const data = await apiGetClient('/conversations?limit=50');
        setItems(data?.items ?? []);
        if (!selectedId && data?.items?.[0]?.id) setSelectedId(data.items[0].id);
      } catch {}
    }, 5000);
    return () => clearInterval(t);
  }, [selectedId]);

  return (
    <div className="h-dvh grid grid-cols-[360px_1fr]">
      <ConversationList
        items={items}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <Thread conversationId={selectedId} />
    </div>
  );
}
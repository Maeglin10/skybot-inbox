export async function fetchConversation(id: string) {
  const res = await fetch(`/api/proxy/conversations/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`fetchConversation failed: ${res.status}`);
  return res.json();
}

export async function fetchConversations(params: {
  limit?: number;
  cursor?: string | null;
  lite?: boolean;
  status?: string;
  inboxId?: string;
}) {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.cursor) qs.set('cursor', params.cursor);
  if (params.lite) qs.set('lite', '1');
  if (params.status) qs.set('status', params.status);
  if (params.inboxId) qs.set('inboxId', params.inboxId);

  const res = await fetch(`/api/proxy/conversations?${qs.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`fetchConversations failed: ${res.status}`);
  return res.json() as Promise<{ items: unknown[]; nextCursor: string | null }>;
}
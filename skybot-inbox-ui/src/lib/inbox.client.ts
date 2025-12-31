'use client';

import { apiGetClient } from './api.client';

export async function fetchConversations(input?: {
  limit?: number;
  lite?: boolean;
  cursor?: string | null;
  status?: 'OPEN' | 'PENDING' | 'CLOSED';
}) {
  const limit = Math.min(Math.max(input?.limit ?? 20, 1), 100);
  const lite = input?.lite ? '1' : '0';
  const status = input?.status;
  const cursor = input?.cursor ?? null;

  const qs = new URLSearchParams();
  qs.set('limit', String(limit));
  qs.set('lite', lite);

  if (status) qs.set('status', status);

  // IMPORTANT: ne jamais envoyer cursor=null / undefined
  if (cursor && cursor !== 'null' && cursor !== 'undefined') qs.set('cursor', cursor);

  const path = `/conversations?${qs.toString()}`;
  return apiGetClient(path);
}

export async function fetchConversation(id: string) {
  return apiGetClient(`/conversations/${encodeURIComponent(id)}`);
}
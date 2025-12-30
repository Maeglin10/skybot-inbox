'use client';

import { apiClientFetch } from './api.client';

export async function fetchConversations(params?: {
  limit?: number;
  cursor?: string | null;
  lite?: boolean;
  status?: 'OPEN' | 'PENDING' | 'CLOSED';
}) {
  const q = new URLSearchParams();
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.cursor) q.set('cursor', String(params.cursor));
  if (params?.lite) q.set('lite', '1');
  if (params?.status) q.set('status', params.status);

  const qs = q.toString();
  return apiClientFetch(`/conversations${qs ? `?${qs}` : ''}`);
}

export async function fetchConversation(id: string) {
  return apiClientFetch(`/conversations/${id}`);
}
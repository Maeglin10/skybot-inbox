'use client';

import { apiGetClient } from './api.client';

export async function fetchConversations(input: {
  limit?: number;
  cursor?: string | null;
  lite?: boolean;
  status?: 'OPEN' | 'PENDING' | 'CLOSED';
}) {
  const params = new URLSearchParams();
  if (input.limit != null) params.set('limit', String(input.limit));
  if (input.cursor) params.set('cursor', input.cursor);
  if (input.lite) params.set('lite', '1');
  if (input.status) params.set('status', input.status);

  const qs = params.toString();
  return apiGetClient(`/conversations${qs ? `?${qs}` : ''}`);
}

export async function fetchConversation(id: string) {
  return apiGetClient(`/conversations/${id}`);
}
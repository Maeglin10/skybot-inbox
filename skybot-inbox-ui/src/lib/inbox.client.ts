'use client';

import { apiGetClient } from './api.client';

export async function fetchConversations(input?: {
  limit?: number;
  cursor?: string | null;
  lite?: boolean;
  status?: 'OPEN' | 'PENDING' | 'CLOSED';
}) {
  const params = new URLSearchParams();

  if (input?.limit) params.set('limit', String(input.limit));
  if (input?.lite) params.set('lite', '1');
  if (input?.status) params.set('status', input.status);

  // IMPORTANT: never send cursor=null/undefined/empty
  if (typeof input?.cursor === 'string' && input.cursor.trim() && input.cursor !== 'null') {
    params.set('cursor', input.cursor);
  }

  const qs = params.toString();
  return apiGetClient(`/conversations${qs ? `?${qs}` : ''}`);
}

export async function fetchConversation(conversationId: string) {
  return apiGetClient(`/conversations/${conversationId}`);
}
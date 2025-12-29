'use client';

import { apiClientFetch } from './api.client';

export async function sendMessage(input: {
  conversationId: string;
  to: string;
  text: string;
}) {
  return apiClientFetch('/messages', {
    method: 'POST',
    body: JSON.stringify(input),
  }) as Promise<{
    id: string;
    conversationId: string;
    direction: 'IN' | 'OUT';
    text: string | null;
    timestamp: string;
  }>;
}

export async function listMessages(input: {
  conversationId: string;
  limit?: number;
  cursor?: string;
}) {
  const qs = new URLSearchParams();
  if (input.limit != null) qs.set('limit', String(input.limit));
  if (input.cursor) qs.set('cursor', input.cursor);

  return apiClientFetch(
    `/conversations/${encodeURIComponent(input.conversationId)}/messages?${qs.toString()}`,
    { method: 'GET' },
  ) as Promise<{
    items: Array<{
      id: string;
      text: string | null;
      timestamp: string;
      direction: 'IN' | 'OUT';
      from?: string;
      to?: string;
    }>;
    nextCursor: string | null;
  }>;
}
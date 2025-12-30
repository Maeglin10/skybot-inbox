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
  });
}

export async function listMessages(input: {
  conversationId: string;
  limit?: number;
  cursor?: string;
}) {
  const qs = new URLSearchParams();
  if (typeof input.limit === 'number') qs.set('limit', String(input.limit));
  if (typeof input.cursor === 'string' && input.cursor) qs.set('cursor', input.cursor);

  const path = `/conversations/${input.conversationId}/messages${
    qs.toString() ? `?${qs.toString()}` : ''
  }`;

  return apiClientFetch(path, { method: 'GET' }) as Promise<{
    items: Array<{
      id: string;
      text: string | null;
      timestamp: string;
      direction: 'IN' | 'OUT' | string;
      from?: string;
      to?: string;
    }>;
    nextCursor: string | null;
  }>;
}
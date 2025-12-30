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
  if (typeof input.cursor === 'string') qs.set('cursor', input.cursor);

  const q = qs.toString();
  const path = `/conversations/${input.conversationId}/messages${q ? `?${q}` : ''}`;
  return apiClientFetch(path);
}
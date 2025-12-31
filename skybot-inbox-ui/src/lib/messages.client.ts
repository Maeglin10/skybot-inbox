'use client';

import { apiGetClient, apiPostClient } from './api.client';

export async function listMessages(input: {
  conversationId: string;
  limit?: number;
  cursor?: string | null;
}) {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
  const cursor = input.cursor ?? null;

  const qs = new URLSearchParams();
  qs.set('limit', String(limit));

  // IMPORTANT: ne jamais envoyer cursor=null / undefined
  if (cursor && cursor !== 'null' && cursor !== 'undefined') qs.set('cursor', cursor);

  const path = `/conversations/${encodeURIComponent(input.conversationId)}/messages?${qs.toString()}`;
  return apiGetClient(path);
}

export async function sendMessage(input: {
  conversationId: string;
  to: string;
  text: string;
}) {
  return apiPostClient(`/conversations/${encodeURIComponent(input.conversationId)}/messages`, {
    to: input.to,
    text: input.text,
  });
}
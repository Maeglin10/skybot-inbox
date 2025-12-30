'use client';

import { apiClientFetch } from './api.client';

export async function patchConversationStatus(input: {
  conversationId: string;
  status: 'OPEN' | 'CLOSED';
}) {
  return apiClientFetch(`/conversations/${input.conversationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: input.status }),
  });
}
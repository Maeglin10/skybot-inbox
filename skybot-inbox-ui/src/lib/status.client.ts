'use client';

import type { InboxConversationStatus } from '@/components/inbox/inbox-shell';
import { apiPatchClient } from './api.client';
import type { Status } from "@/lib/types";

export async function patchConversationStatus(input: {
  conversationId: string;
  status: InboxConversationStatus;
}) {
  return apiPatchClient(`/conversations/${input.conversationId}/status`, {
    status: input.status,
  });
}
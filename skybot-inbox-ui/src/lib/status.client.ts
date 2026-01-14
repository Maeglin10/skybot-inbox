"use client";

import { apiPatchClient } from "./api.client";

export type InboxConversationStatus = "OPEN" | "PENDING" | "CLOSED";

export async function patchConversationStatus(input: {
  conversationId: string;
  status: InboxConversationStatus;
}) {
  return apiPatchClient(`/conversations/${input.conversationId}/status`, {
    status: input.status,
  });
}
import { apiPatchClient } from "@/lib/api.client";

export type ConversationStatus = "OPEN" | "CLOSED";

export async function patchConversationStatus(params: {
  conversationId: string;
  status: ConversationStatus;
}) {
  const { conversationId, status } = params;
  return apiPatchClient(`/conversations/${conversationId}/status`, { status });
}

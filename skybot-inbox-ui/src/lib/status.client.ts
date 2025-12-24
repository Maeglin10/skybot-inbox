import { apiPatchClient } from "@/lib/api.client";

export async function patchConversationStatus(params: {
  conversationId: string;
  status: "OPEN" | "CLOSED";
}) {
  const { conversationId, status } = params;
  return apiPatchClient(`/conversations/${conversationId}/status`, { status });
}

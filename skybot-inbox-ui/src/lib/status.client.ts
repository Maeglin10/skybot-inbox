import { apiPatchClient } from "@/lib/api.client";

export async function patchConversationStatus(params: {
  conversationId: string;
  status: "OPEN" | "CLOSED";
}) {
  return apiPatchClient(`/conversations/${params.conversationId}/status`, {
    status: params.status,
  });
}
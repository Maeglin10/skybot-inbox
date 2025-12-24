import { apiGetClient } from "@/lib/api.client";

export async function fetchConversation(id: string) {
  return apiGetClient(`/conversations/${id}`);
}

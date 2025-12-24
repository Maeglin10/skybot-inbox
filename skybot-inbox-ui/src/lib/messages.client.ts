import { apiPostClient } from "@/lib/api.client";

export async function sendMessage(params: {
  conversationId: string;
  to: string;
  text: string;
  externalId?: string | null;
}) {
  return apiPostClient("/messages", params);
}

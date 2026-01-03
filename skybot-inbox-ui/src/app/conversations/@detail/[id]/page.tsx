import ConversationClient from "@/app/conversations/[id]/ConversationClient";
import { apiGetServer } from "@/lib/api.server";

type Status = "OPEN" | "PENDING" | "CLOSED";

type Message = {
  id: string;
  conversationId: string;
  direction: "IN" | "OUT";
  from: string;
  to: string;
  text: string;
  timestamp: string;
  createdAt: string;
  externalId?: string | null;
};

type Conversation = {
  id: string;
  status: Status;
  updatedAt: string;
  lastActivityAt?: string;
  messages: Message[];
};

export default async function DetailConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conv = (await apiGetServer(`/conversations/${id}`)) as Conversation;
  return <ConversationClient initial={conv} />;
}
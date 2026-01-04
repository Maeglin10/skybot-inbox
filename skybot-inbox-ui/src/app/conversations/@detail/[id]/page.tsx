import ConversationClient from "@/components/conversations/ConversationClient";
import { apiGetServer } from "@/lib/api.server";
import type { Conversation } from '@/lib/types';

export default async function DetailConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conv = (await apiGetServer(`/conversations/${id}`)) as Conversation;
  return <ConversationClient initial={conv} />;
}
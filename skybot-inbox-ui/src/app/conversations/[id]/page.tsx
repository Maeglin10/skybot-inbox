import ConversationClient from './ConversationClient';
import { apiGetServer as apiGet } from '@/lib/api.server';

export default async function ConversationPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const res = await fetch(`/api/_proxy/conversations/${id}`, { cache: 'no-store' });
  const conv = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(conv));

  return <ConversationClient convId={id} initial={conv} />;
}
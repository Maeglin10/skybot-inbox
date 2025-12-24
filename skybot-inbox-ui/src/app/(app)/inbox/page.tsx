import { apiGetServer } from '@/lib/api.server';
import { InboxShell } from '@/components/inbox/inbox-shell';

export default async function InboxPage() {
  const data = await apiGetServer('/conversations?limit=50');
  return <InboxShell initialItems={data?.items ?? []} />;
}
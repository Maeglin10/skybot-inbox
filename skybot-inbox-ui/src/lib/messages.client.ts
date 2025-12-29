type Json = Record<string, unknown>;

async function http<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} ${text}`);
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export async function sendMessage(input: {
  conversationId: string;
  to: string;
  text: string;
}) {
  return http<Json>(`/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
}

// compat: thread.tsx importait postMessage
export const postMessage = sendMessage;

export async function listMessages(input: {
  conversationId: string;
  limit?: number;
  cursor?: string | null;
}) {
  const qs = new URLSearchParams();
  if (input.limit) qs.set('limit', String(input.limit));
  if (input.cursor) qs.set('cursor', input.cursor);

  const q = qs.toString();
  return http<{ items: Array<{
    id: string;
    text: string | null;
    timestamp: string;
    direction: 'IN' | 'OUT' | string;
    from?: string;
    to?: string;
  }>; nextCursor: string | null }>(
    `/conversations/${input.conversationId}/messages${q ? `?${q}` : ''}`,
    { method: 'GET' },
  );
}
'use client';

export async function apiClientFetch(path: string, init: RequestInit = {}) {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  // 🔴 Exception: POST messages doit passer par le route handler Next
  // /api/conversations/:id/messages  →  upstream POST /messages
  const isConversationMessages =
    /^\/conversations\/[^/]+\/messages(\?.*)?$/.test(normalized);

  const url = isConversationMessages
    ? `/api${normalized}`
    : `/api/proxy${normalized}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} ${txt}`);
  }

  return res.json();
}

export const apiGetClient = (path: string) => apiClientFetch(path);

export const apiPostClient = (path: string, body: unknown) =>
  apiClientFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const apiPatchClient = (path: string, body: unknown) =>
  apiClientFetch(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
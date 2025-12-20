// src/lib/api.client.ts
'use client';

export async function apiFetchClient(path: string, init: RequestInit = {}) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const url = `/api/_proxy${p}`;

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

export const apiGetClient = (path: string) => apiFetchClient(path);

export const apiPostClient = (path: string, body: unknown) =>
  apiFetchClient(path, { method: 'POST', body: JSON.stringify(body) });

export const apiPatchClient = (path: string, body: unknown) =>
  apiFetchClient(path, { method: 'PATCH', body: JSON.stringify(body) });
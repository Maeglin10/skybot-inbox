// src/lib/api.server.ts
import 'server-only';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
const KEY = process.env.API_KEY ?? process.env.NEXT_PUBLIC_API_KEY ?? '';

export async function apiServerFetch(path: string, init: RequestInit = {}) {
  const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': KEY,
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

export const apiGetServer = (path: string) => apiServerFetch(path);
export const apiPostServer = (path: string, body: unknown) =>
  apiServerFetch(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPatchServer = (path: string, body: unknown) =>
  apiServerFetch(path, { method: 'PATCH', body: JSON.stringify(body) });
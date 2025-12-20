import 'server-only';

const BASE = process.env.API_URL ?? 'http://127.0.0.1:3001';
const KEY  = process.env.API_KEY ?? '';

export async function apiServerFetch(path: string, init: RequestInit = {}) {
  const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      'x-api-key': KEY,
      'content-type': 'application/json',
    },
    cache: 'no-store',
  });

  const txt = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} ${txt}`);

  return txt ? JSON.parse(txt) : null;
}

export const apiGetServer = (path: string) => apiServerFetch(path);
export const apiPostServer = (path: string, body: unknown) =>
  apiServerFetch(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPatchServer = (path: string, body: unknown) =>
  apiServerFetch(path, { method: 'PATCH', body: JSON.stringify(body) });
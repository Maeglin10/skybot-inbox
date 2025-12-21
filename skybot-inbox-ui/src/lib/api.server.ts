import 'server-only';

const BASE = process.env.APP_URL ?? 'http://localhost:3000';

export async function apiServerFetch(path: string, init: RequestInit = {}) {
  const url = `${BASE}/api/proxy${path.startsWith('/') ? path : `/${path}`}`;

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

export const apiGetServer = (path: string) => apiServerFetch(path);
export const apiPostServer = (path: string, body: unknown) =>
  apiServerFetch(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPatchServer = (path: string, body: unknown) =>
  apiServerFetch(path, { method: 'PATCH', body: JSON.stringify(body) });
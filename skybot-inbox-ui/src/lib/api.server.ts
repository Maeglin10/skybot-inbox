const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://127.0.0.1:3001';

const KEY = process.env.NEXT_PUBLIC_API_KEY ?? '';

export async function apiFetchServer(path: string, init: RequestInit = {}) {
  const url = `${BASE.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

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

export const apiGetServer = (path: string) => apiFetchServer(path);
export const apiPostServer = (path: string, body: unknown) =>
  apiFetchServer(path, { method: 'POST', body: JSON.stringify(body) });
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3001';
const KEY = process.env.NEXT_PUBLIC_API_KEY ?? '';

export async function apiFetch(path: string, init: RequestInit = {}) {
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

export const apiGet = (path: string) => apiFetch(path);
export const apiPost = (path: string, body: unknown) =>
  apiFetch(path, { method: 'POST', body: JSON.stringify(body) });

const BASE = '/api/_proxy';
const KEY = process.env.NEXT_PUBLIC_API_KEY ?? '';

export async function apiFetchClient(path: string, init: RequestInit = {}) {
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

export const apiGetClient = (path: string) => apiFetchClient(path);
export const apiPostClient = (path: string, body: unknown) =>
  apiFetchClient(path, { method: 'POST', body: JSON.stringify(body) });
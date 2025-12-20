'use client';

export async function apiFetchClient(path: string, init: RequestInit = {}) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const url = `/api/proxy${p}`; // <- ici

  const res = await fetch(url, { ...init, cache: 'no-store' });
  return res;
}

export const apiGetClient = (path: string) => apiFetchClient(path);

export const apiPostClient = (path: string, body: unknown) =>
  apiFetchClient(path, { method: 'POST', body: JSON.stringify(body) });

export const apiPatchClient = (path: string, body: unknown) =>
  apiFetchClient(path, { method: 'PATCH', body: JSON.stringify(body) });
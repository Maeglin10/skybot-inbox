const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3000";
const KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "x-api-key": KEY,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${txt}`);
  }
  return res.json();
}

export function apiGet(path: string) {
  return apiFetch(path, { method: "GET" });
}

import "server-only";

const BASE = process.env.APP_URL ?? "http://localhost:3000";

export async function apiServerFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const url = `${BASE}/api/proxy${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    next: { revalidate: 5 },
  });

  const txt = await res.text().catch(() => "");
  const isJson = res.headers.get("content-type")?.includes("application/json");

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} ${txt}`);
  }

  if (!isJson) return txt;
  return JSON.parse(txt || "null") as unknown;
}

export const apiGetServer = (path: string) => apiServerFetch(path);
export const apiPostServer = (path: string, body: unknown) =>
  apiServerFetch(path, { method: "POST", body: JSON.stringify(body) });
export const apiPatchServer = (path: string, body: unknown) =>
  apiServerFetch(path, { method: "PATCH", body: JSON.stringify(body) });
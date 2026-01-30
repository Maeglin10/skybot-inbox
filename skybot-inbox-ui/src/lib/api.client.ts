'use client';

export async function apiClientFetch(path: string, init: RequestInit = {}) {
  const normalized = path.startsWith('/') ? path : `/${path}`;

  // 🔴 Exception: POST messages doit passer par le route handler Next
  // /api/conversations/:id/messages  →  upstream POST /messages
  const isConversationMessages =
    /^\/conversations\/[^/]+\/messages(\?.*)?$/.test(normalized);

  const url = isConversationMessages
    ? `/api${normalized}`
    : `/api/proxy${normalized}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers ?? {}),
  };

  // Auto-attach Bearer token from cookie if available in browser
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp('(^| )accessToken=([^;]+)'));
    if (match) {
      // @ts-ignore
      headers['Authorization'] = `Bearer ${match[2]}`;
    }
  }

  let res = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
  });

  // Handle 401 Unauthorized - Attempt Refresh
  if (res.status === 401 && typeof document !== 'undefined') {
    try {
      const refreshMatch = document.cookie.match(new RegExp('(^| )refreshToken=([^;]+)'));
      if (refreshMatch) {
         const refreshToken = decodeURIComponent(refreshMatch[2]);
         
         // Call refresh endpoint
         // We use straight fetch here to avoid recursion
         const refreshRes = await fetch('/api/proxy/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
         });
         
         if (refreshRes.ok) {
             const data = await refreshRes.json();
             
             // Update cookies
             // Note: We use max-age from response or default to session/1h
             const cookieOptions = `; path=/; secure; samesite=strict`;
             document.cookie = `accessToken=${data.accessToken}${cookieOptions}`;
             document.cookie = `refreshToken=${data.refreshToken}${cookieOptions}`;
             
             // Retry original request with new token
             // @ts-ignore
             headers['Authorization'] = `Bearer ${data.accessToken}`;
             
             res = await fetch(url, {
                ...init,
                headers,
                cache: 'no-store',
             });
         }
      }
    } catch(e) {
       console.error("Token refresh attempt failed", e);
    }
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} ${txt}`);
  }

  return res.json();
}

export const apiGetClient = (path: string) => apiClientFetch(path);

export const apiPostClient = (path: string, body: unknown) =>
  apiClientFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const apiPatchClient = (path: string, body: unknown) =>
  apiClientFetch(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
import type { ChartPoint, KpiData, BreakdownData, TimeRange, MetricGroup } from '../types/analytics';

// Get clientKey from environment or use a default for development
const getClientKey = () => {
  return typeof window !== 'undefined'
    ? localStorage.getItem('clientKey') || 'demo-client'
    : 'demo-client';
};

async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = {
    ...init.headers,
    'x-client-key': getClientKey(),
  };

  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = `/api/proxy${normalized}`;

  const res = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} ${txt}`);
  }

  return res.json();
}

export async function fetchMainChart(range: TimeRange, metric: MetricGroup): Promise<ChartPoint[]> {
  return apiFetch(`/analytics/chart?range=${range}&metric=${metric}`);
}

export async function fetchKpis(metric: MetricGroup): Promise<KpiData[]> {
  return apiFetch(`/analytics/kpis?metric=${metric}`);
}

export async function fetchBreakdown(type: 'CHANNEL' | 'TEMPERATURE' | 'RATING'): Promise<BreakdownData[]> {
  return apiFetch(`/analytics/breakdown?type=${type}`);
}

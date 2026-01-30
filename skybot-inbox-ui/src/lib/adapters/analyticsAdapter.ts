import type { ChartPoint, KpiData, BreakdownData, TimeRange, MetricGroup } from '../types/analytics';

import { apiClientFetch } from '../api.client';

// Get clientKey from environment or use a default for development
const getClientKey = () => {
  return typeof window !== 'undefined'
    ? localStorage.getItem('clientKey') || 'demo-client'
    : 'demo-client';
};

async function apiFetch(path: string, init: RequestInit = {}) {
  return apiClientFetch(path, {
    ...init,
    headers: {
      ...init.headers,
      'x-client-key': getClientKey(),
    },
  });
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

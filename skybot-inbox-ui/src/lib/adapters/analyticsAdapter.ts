import { mockDelay } from '../api.mock';
import type { ChartPoint, KpiData, BreakdownData, TimeRange, MetricGroup } from '../types/analytics';

// Mock data generators
function generateSeries(points: number, base: number, variance: number): ChartPoint[] {
  const data: ChartPoint[] = [];
  const now = new Date();
  for (let i = points; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString(),
      value: Math.max(0, Math.floor(base + (Math.random() - 0.5) * variance))
    });
  }
  return data;
}

export async function fetchMainChart(range: TimeRange, metric: MetricGroup): Promise<ChartPoint[]> {
  await mockDelay(600);
  const points = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  
  // Diff base values for metrics
  let base = 50;
  let variance = 20;
  
  if (metric === 'CONVERSIONS') { base = 15; variance = 5; }
  if (metric === 'FOLLOWUPS') { base = 120; variance = 40; }
  if (metric === 'FEEDBACK') { base = 8; variance = 6; }

  return generateSeries(points, base, variance);
}

export async function fetchKpis(metric: MetricGroup): Promise<KpiData[]> {
  await mockDelay(400);
  
  if (metric === 'LEADS') {
    return [
       { label: 'New Leads', value: '142', change: '+12%', trend: 'up' },
       { label: 'Qualified', value: '48', change: '+5%', trend: 'up' },
       { label: 'Lost', value: '12', change: '-2%', trend: 'down' }, // down is good here? context dependent
       { label: 'Cost per Lead', value: '$4.20', change: '+1%', trend: 'neutral' }
    ];
  }
  
  if (metric === 'CONVERSIONS') {
     return [
       { label: 'Total Conversions', value: '38', change: '+8%', trend: 'up' },
       { label: 'Conv. Rate', value: '24%', change: '+1.5%', trend: 'up' },
       { label: 'Revenue', value: '$12.5k', change: '+18%', trend: 'up' },
       { label: 'Avg Deal', value: '$350', change: '-4%', trend: 'down' }
     ];
  }

  // Default fallback
  return [
     { label: 'Metric A', value: '1,234', change: '+10%', trend: 'up' },
     { label: 'Metric B', value: '56%', change: '-2%', trend: 'down' },
     { label: 'Metric C', value: '89', change: '0%', trend: 'neutral' },
     { label: 'Metric D', value: '4.5', change: '+0.1', trend: 'up' }
  ];
}

export async function fetchBreakdown(type: 'CHANNEL' | 'TEMPERATURE' | 'RATING'): Promise<BreakdownData[]> {
  await mockDelay(500);
  
  if (type === 'CHANNEL') {
     return [
       { label: 'WhatsApp', value: 45 },
       { label: 'Email', value: 30 },
       { label: 'Instagram', value: 15 },
       { label: 'Other', value: 10 }
     ];
  }

  if (type === 'TEMPERATURE') {
     return [
       { label: 'Hot', value: 20 },
       { label: 'Warm', value: 50 },
       { label: 'Cold', value: 30 }
     ];
  }
  
  if (type === 'RATING') {
     return [
       { label: '5 Stars', value: 60 },
       { label: '4 Stars', value: 25 },
       { label: '3 Stars', value: 10 },
       { label: '1-2 Stars', value: 5 }
     ];
  }

  return [];
}

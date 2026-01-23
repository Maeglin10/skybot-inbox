export type TimeRange = '7d' | '30d' | '90d';
export type Granularity = 'day' | 'week' | 'month';
export type MetricGroup = 'LEADS' | 'CONVERSIONS' | 'FOLLOWUPS' | 'FEEDBACK';

export interface ChartPoint {
  date: string;
  value: number;
}

export interface KpiData {
  label: string;
  value: string;
  change?: string; // e.g. "+12%"
  trend?: 'up' | 'down' | 'neutral';
}

export interface BreakdownData {
  label: string;
  value: number;
}

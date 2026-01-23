import AnalyticsDashboard from '@/components/analytics/analytics-dashboard';

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  return (
    <div className="ui-page p-6 overflow-y-auto">
      <h1 className="ui-pageTitle">Analytics</h1>
      <p className="ui-pageSubtitle">Insights and performance metrics.</p>
      
      <AnalyticsDashboard />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api/agents';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { useAgentsWebSocket } from '@/hooks/useAgentsWebSocket';

export default function AgentsAnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const { onAgentExecution } = useAgentsWebSocket();

  useEffect(() => {
    loadOverview();

    // Listen for global execution metrics updates
    onAgentExecution((payload) => {
       setOverview((prev: any) => {
          if (!prev) return prev;
          return {
             ...prev,
             totalExecutionsToday: prev.totalExecutionsToday + 1
          }
       });
    });
  }, []);

  async function loadOverview() {
    try {
      const { data } = await analyticsApi.getOverview();
      setOverview(data);
    } catch (e) {
      console.error(e);
      // Mock Fallback
      setOverview({
         totalAgents: 12,
         activeAgents: 8,
         totalExecutionsToday: 1450,
         avgResponseTime: 1.2,
         errorRate: 0.5
      });
    }
  }

  if (!overview) return <div className="p-8">Loading...</div>;

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Agents Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalAgents}</div>
              <p className="text-xs text-muted-foreground">
                {overview.activeAgents} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Executions Today
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-in zoom-in duration-300 key={overview.totalExecutionsToday}">
                {overview.totalExecutionsToday.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Response Time
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.avgResponseTime}s</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.errorRate}%</div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 md:grid md:grid-cols-2 gap-6">
           {/* Placeholder for Charts (BarChart / LineChart) */}
           <Card className="h-[300px] flex items-center justify-center text-muted-foreground border-dashed">
              Cost Analysis Chart
           </Card>
           <Card className="h-[300px] flex items-center justify-center text-muted-foreground border-dashed">
              Execution Trend Chart
           </Card>
        </div>
      </div>
    </div>
  );
}

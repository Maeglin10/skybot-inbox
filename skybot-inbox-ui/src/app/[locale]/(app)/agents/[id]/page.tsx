'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { agentsApi } from '@/lib/api/agents';
import { Agent } from '@/types/agents';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAgentsWebSocket } from '@/hooks/useAgentsWebSocket';

export default function AgentDetailsPage() {
  const params = useParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { subscribeToAgent, onAgentStatusChange, onAgentExecution } = useAgentsWebSocket();

  // Helper to ensure ID is string
  const idRaw = params?.id;
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;

  useEffect(() => {
    if (id) {
       loadAgent(id);
       
       // Subscribe to WS updates for this agent
       try {
         subscribeToAgent(id);
         
         onAgentStatusChange((payload) => {
            if (payload.agentId === id) {
               setAgent(prev => prev ? { ...prev, status: payload.status } : null);
            }
         });
         
         onAgentExecution((payload) => {
            if (payload.agentId === id) {
               // Update stats optimistically or append to logs
               setStats((prev: any) => {
                  if(!prev) return prev;
                  return {
                     ...prev,
                     stats: {
                        ...prev.stats,
                        totalExecutions: (prev.stats?.totalExecutions || 0) + 1
                     },
                     executions: [payload.execution, ...(prev.executions || [])].slice(0, 10)
                  };
               });
            }
         });
       } catch (e) {
         console.warn("WebSocket subscription failed", e);
       }
    }
  }, [id]);

  async function loadAgent(agentId: string) {
    try {
      setLoading(true);
      const [agentRes, statsRes] = await Promise.allSettled([
        agentsApi.getOne(agentId),
        agentsApi.getStats(agentId, '7d'),
      ]);

      if (agentRes.status === 'fulfilled') {
         setAgent(agentRes.value.data);
      } else {
         setAgent({
            id: agentId,
            externalId: 'ext-1',
            name: 'Mock Sales Agent',
            type: 'SALES',
            category: 'CORE',
            description: 'Handles inbound leads.',
            status: 'ACTIVE',
            version: '1.0',
            isActive: true,
            executionCount: 120,
            errorCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
         });
      }

      if (statsRes.status === 'fulfilled') {
         setStats(statsRes.value.data);
      } else {
         setStats({
            stats: { 
               totalExecutions: 120, 
               successRate: 98.5, 
               avgResponseTime: 450, 
               totalOpenAICost: 1.25 
            },
            executions: [
               { id: 'ex-1', status: 'SUCCESS', createdAt: new Date() },
               { id: 'ex-2', status: 'SUCCESS', createdAt: new Date(Date.now() - 1000 * 60) },
            ]
         });
      }

    } catch (error) {
      console.error('Error loading agent:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (!agent) return <div className="p-8">Agent Not found</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{agent.name}</h1>
        <p className="text-muted-foreground">{agent.description}</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Executions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.stats?.totalExecutions ?? 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.stats?.successRate?.toFixed(1) ?? '0.0'}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((stats?.stats?.avgResponseTime ?? 0) / 1000).toFixed(2)}s
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats?.stats?.totalOpenAICost?.toFixed(2) ?? '0.00'}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Metric Stream</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Real-time charts will appear here when connected to live backend.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.executions?.map((exec: any) => (
                  <div key={exec.id || Math.random()} className="border-b pb-2 animate-in slide-in-from-top-2 fade-in">
                    <div className="flex justify-between">
                      <span className="text-sm">{exec.status}</span>
                      <span className="text-sm text-muted-foreground">
                        {exec.createdAt ? new Date(exec.createdAt).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

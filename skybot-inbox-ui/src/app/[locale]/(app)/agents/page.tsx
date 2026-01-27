'use client';

import { useEffect, useState } from 'react';
import { agentsApi } from '@/lib/api/agents';
import { Agent } from '@/types/agents';
import { AgentCard } from '@/components/agents/agent-card';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAgentsWebSocket } from '@/hooks/useAgentsWebSocket';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { onAgentStatusChange } = useAgentsWebSocket();

  useEffect(() => {
    loadAgents();

    // Only set up WebSocket listener if we have a valid connection
    try {
      onAgentStatusChange((payload) => {
         setAgents(prev => prev.map(a => a.id === payload.agentId ? { ...a, status: payload.status } : a));
      });
    } catch (e) {
      // WebSocket not connected, ignore - will still work without real-time updates
      console.log('WebSocket not available for real-time updates');
    }
  }, []);

  async function loadAgents() {
    try {
      setLoading(true);
      setError(null);
      const { data } = await agentsApi.getAll();
      if (Array.isArray(data)) {
         setAgents(data);
      } else {
         setAgents([]);
      }
    } catch (e) {
      console.error(e);
      // Removed mock fallback to demonstrate error state handling per Prompt 9
      setError("Failed to load agents. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      await agentsApi.toggleStatus(id);
      await loadAgents(); // simplistic refresh
    } catch (e) {
      console.error('Error toggling agent:', e);
      // Could show toast here
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
           <Skeleton className="h-10 w-48" />
           <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
     return (
       <div className="container mx-auto p-6">
          <Alert variant="destructive">
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>Error</AlertTitle>
             <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => loadAgents()} variant="outline" className="mt-4">
             Retry
          </Button>
       </div>
     );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-muted-foreground">Manage your AI agents</p>
        </div>
        <Link href="/agents/marketplace">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Agent
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.length === 0 ? (
           <div className="col-span-full text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
              No agents found. Add one from the marketplace.
           </div>
        ) : (
          agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onToggle={() => handleToggle(agent.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

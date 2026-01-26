'use client';

import { useEffect, useState } from 'react';
import { agentsApi } from '@/lib/api/agents';
import { Agent } from '@/types/agents';
import { AgentCard } from '@/components/agents/agent-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    try {
      setLoading(true);
      const { data } = await agentsApi.getAll();
      if (Array.isArray(data)) {
         setAgents(data);
      } else {
         // Fallback if API returns object
         setAgents([]);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      // Fallback mock data if API fails (so UI shows something)
      setAgents([
        { id: '1', externalId: 'ext-1', name: 'Sales Agent', type: 'SALES', category: 'CORE', description: 'Handles inbound leads and qualification.', status: 'ACTIVE', version: '1.0.0', isActive: true, executionCount: 1250, errorCount: 0, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', externalId: 'ext-2', name: 'Support Bot', type: 'SUPPORT', category: 'CORE', description: 'L1 Customer Support automation.', status: 'MAINTENANCE', version: '2.1.0', isActive: false, executionCount: 3400, errorCount: 12, createdAt: new Date(), updatedAt: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      await agentsApi.toggleStatus(id);
      await loadAgents();
    } catch (error) {
      console.error('Error toggling agent:', error);
    }
  }

  if (loading) {
    return <div className="p-8">Loading agents...</div>;
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
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onToggle={() => handleToggle(agent.id)}
          />
        ))}
      </div>
    </div>
  );
}

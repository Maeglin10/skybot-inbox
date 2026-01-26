import { Agent, AgentStatus } from '@/types/agents';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Activity, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface AgentCardProps {
  agent: Agent;
  onToggle: () => void;
}

export function AgentCard({ agent, onToggle }: AgentCardProps) {
  const statusColors: Record<AgentStatus, string> = {
    ACTIVE: 'bg-green-500',
    INACTIVE: 'bg-gray-400',
    DEPLOYING: 'bg-yellow-500',
    ERROR: 'bg-red-500',
    MAINTENANCE: 'bg-orange-500',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{agent.name}</CardTitle>
        <CardDescription className="mt-1 line-clamp-2">
          {agent.description || 'No description'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${statusColors[agent.status]}`} />
              <span className="text-sm font-medium">{agent.status}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <Badge variant="secondary">{agent.type}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Executions</span>
            <span className="text-sm font-medium">
              {agent.executionCount.toLocaleString()}
            </span>
          </div>

          {agent.errorCount > 0 && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{agent.errorCount} errors</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Switch checked={agent.status === 'ACTIVE'} onCheckedChange={onToggle} />
            <span className="text-sm">
              {agent.status === 'ACTIVE' ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <Link href={`/agents/${agent.id}`}>
            <Button variant="outline" size="sm">
              <Activity className="mr-2 h-4 w-4" />
              View Stats
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

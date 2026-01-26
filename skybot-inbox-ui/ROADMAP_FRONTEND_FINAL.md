# 🗺️ Roadmap Frontend skybot-inbox-ui - FINAL

**Pour**: Antigravity (Claude Frontend)
**Stack**: Next.js 16 + shadcn/ui + TailwindCSS + TypeScript
**Durée**: 6 semaines
**Start Date**: 27 janvier 2026

---

## 🎯 Mission

Interface complète pour gérer 50+ agents, marketplace, analytics temps réel.

---

## 📅 SEMAINE 1: Setup Infrastructure

### ✅ TASK 1: Install shadcn/ui Components (Jour 1)

**Execute**:

```bash
cd skybot-inbox-ui

npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tabs
npx shadcn@latest add table
npx shadcn@latest add pagination
npx shadcn@latest add toast
npx shadcn@latest add switch
npx shadcn@latest add select
npx shadcn@latest add label
npx shadcn@latest add form
npx shadcn@latest add alert-dialog
npx shadcn@latest add sheet
npx shadcn@latest add popover
npx shadcn@latest add progress
npx shadcn@latest add command
```

---

### ✅ TASK 2: API Client Setup (Jour 2-3)

**Create** `src/lib/api/agents.ts`:

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const agentsApi = {
  getAll: (filters?: any) =>
    apiClient.get('/agents', { params: filters }),

  getOne: (id: string) =>
    apiClient.get(`/agents/${id}`),

  createFromTemplate: (data: { templateSlug: string; config?: any }) =>
    apiClient.post('/agents/from-template', data),

  toggleStatus: (id: string) =>
    apiClient.put(`/agents/${id}/toggle`),

  getStats: (id: string, period?: string) =>
    apiClient.get(`/agents/${id}/stats`, { params: { period } }),

  delete: (id: string) =>
    apiClient.delete(`/agents/${id}`),
};

export const templatesApi = {
  getAll: (filters?: any) =>
    apiClient.get('/templates', { params: filters }),

  getBySlug: (slug: string) =>
    apiClient.get(`/templates/${slug}`),
};

export const analyticsApi = {
  getOverview: () =>
    apiClient.get('/analytics/agents/overview'),

  getPerformance: (id: string, period: string) =>
    apiClient.get(`/analytics/agents/${id}/performance`, {
      params: { period },
    }),

  getCosts: () =>
    apiClient.get('/analytics/costs'),
};
```

**Create** `src/types/agents.ts`:

```typescript
export interface Agent {
  id: string;
  externalId: string;
  name: string;
  type: AgentType;
  category: AgentCategory;
  description?: string;
  status: AgentStatus;
  version: string;
  isActive: boolean;
  lastExecutedAt?: Date;
  executionCount: number;
  errorCount: number;
  avgResponseTimeMs?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type AgentType =
  | 'SALES'
  | 'SUPPORT'
  | 'ANALYTICS'
  | 'MARKETING'
  | 'HR'
  | 'FINANCE'
  | 'LEGAL'
  | 'OPERATIONS'
  | 'DEVOPS'
  | 'CONTENT'
  | 'INTERNAL'
  | 'CUSTOM';

export type AgentStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'DEPLOYING'
  | 'ERROR'
  | 'MAINTENANCE';

export type AgentCategory = 'CORE' | 'SPECIALIZED' | 'TEMPLATE';

export interface AgentTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: AgentType;
  version: string;
  iconUrl?: string;
  screenshots: string[];
  useCases: string[];
  isPremium: boolean;
  pricing?: number;
  installCount: number;
  avgRating?: number;
}
```

---

### ✅ TASK 3: WebSocket Client (Jour 4-5)

**Install**:

```bash
npm install socket.io-client
```

**Create** `src/lib/websocket/agents-socket.ts`:

```typescript
import { io, Socket } from 'socket.io-client';

class AgentsSocket {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    return this.socket;
  }

  subscribeToAgent(agentId: string) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('subscribe:agent', agentId);
  }

  onAgentStatusChange(callback: (data: any) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('agent:status', callback);
  }

  onAgentExecution(callback: (data: any) => void) {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('agent:execution', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const agentsSocket = new AgentsSocket();
```

**Create** `src/hooks/useAgentsWebSocket.ts`:

```typescript
'use client';

import { useEffect } from 'react';
import { agentsSocket } from '@/lib/websocket/agents-socket';

export function useAgentsWebSocket() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = agentsSocket.connect(token);

    return () => {
      agentsSocket.disconnect();
    };
  }, []);

  return {
    subscribeToAgent: agentsSocket.subscribeToAgent.bind(agentsSocket),
    onAgentStatusChange: agentsSocket.onAgentStatusChange.bind(agentsSocket),
    onAgentExecution: agentsSocket.onAgentExecution.bind(agentsSocket),
  };
}
```

---

## 📅 SEMAINE 2-3: Agents Pages

### ✅ TASK 4: Agents List Page (Jour 6-8)

**Create** `src/app/[locale]/agents/page.tsx`:

```tsx
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
      setAgents(data);
    } catch (error) {
      console.error('Error loading agents:', error);
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
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
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
```

**Create** `src/components/agents/agent-card.tsx`:

```tsx
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
        <CardDescription className="mt-1">
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
```

---

### ✅ TASK 5: Agent Details Page (Jour 9-11)

**Create** `src/app/[locale]/agents/[id]/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { agentsApi } from '@/lib/api/agents';
import { Agent } from '@/types/agents';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function AgentDetailsPage() {
  const params = useParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgent();
  }, [params.id]);

  async function loadAgent() {
    try {
      setLoading(true);
      const [agentRes, statsRes] = await Promise.all([
        agentsApi.getOne(params.id as string),
        agentsApi.getStats(params.id as string, '7d'),
      ]);

      setAgent(agentRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading agent:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!agent) return <div>Not found</div>;

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
                  {stats?.stats.totalExecutions}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.stats.successRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats?.stats.avgResponseTime / 1000).toFixed(2)}s
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats?.stats.totalOpenAICost.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Charts will be here...</p>
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
                {stats?.executions.map((exec: any) => (
                  <div key={exec.id} className="border-b pb-2">
                    <div className="flex justify-between">
                      <span className="text-sm">{exec.status}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(exec.createdAt).toLocaleString()}
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
```

---

## 📅 SEMAINE 3-4: Marketplace

### ✅ TASK 6: Marketplace Page (Jour 12-15)

**Create** `src/app/[locale]/agents/marketplace/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { templatesApi } from '@/lib/api/agents';
import { AgentTemplate } from '@/types/agents';
import { TemplateCard } from '@/components/agents/template-card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function MarketplacePage() {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    const { data } = await templatesApi.getAll();
    setTemplates(data);
  }

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Agent Marketplace</h1>
        <p className="text-muted-foreground">
          Browse and install 50+ ready-to-use AI agents
        </p>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
```

**Create** `src/components/agents/template-card.tsx`:

```tsx
import { AgentTemplate } from '@/types/agents';
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
import { Star, Download } from 'lucide-react';
import Link from 'next/link';

interface TemplateCardProps {
  template: AgentTemplate;
}

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <Badge variant="secondary">{template.category}</Badge>

          {template.avgRating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">
                {template.avgRating.toFixed(1)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-muted-foreground">
            <Download className="h-4 w-4" />
            <span className="text-sm">
              {template.installCount.toLocaleString()} installs
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Link href={`/agents/marketplace/${template.slug}`} className="flex-1">
          <Button variant="outline" className="w-full">
            Learn More
          </Button>
        </Link>
        <Button className="flex-1">Install</Button>
      </CardFooter>
    </Card>
  );
}
```

---

## 📅 SEMAINE 4-5: Analytics

### ✅ TASK 7: Analytics Dashboard (Jour 16-20)

**Create** `src/app/[locale]/analytics/agents/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api/agents';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';

export default function AgentsAnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    const { data } = await analyticsApi.getOverview();
    setOverview(data);
  }

  if (!overview) return <div>Loading...</div>;

  return (
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
            <div className="text-2xl font-bold">
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
    </div>
  );
}
```

---

## 📅 SEMAINE 5-6: Real-Time & Polish

### ✅ TASK 8: Real-Time Updates (Jour 21-23)

**Integrate WebSocket**:

```tsx
'use client';

import { useEffect } from 'react';
import { useAgentsWebSocket } from '@/hooks/useAgentsWebSocket';
import { useToast } from '@/hooks/use-toast';

export function AgentsList() {
  const [agents, setAgents] = useState([]);
  const { onAgentStatusChange, onAgentExecution } = useAgentsWebSocket();
  const { toast } = useToast();

  useEffect(() => {
    onAgentStatusChange((data) => {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === data.agentId ? { ...a, status: data.status } : a,
        ),
      );

      toast({
        title: 'Agent Status Changed',
        description: `${data.agentName} is now ${data.status}`,
      });
    });

    onAgentExecution((data) => {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === data.agentId
            ? { ...a, executionCount: a.executionCount + 1 }
            : a,
        ),
      );
    });
  }, []);

  return (
    // ... render agents
  );
}
```

---

## ✅ Checklist Finale

**Semaine 1**:
- [ ] shadcn/ui components installed
- [ ] API client created
- [ ] WebSocket client created

**Semaine 2-3**:
- [ ] Agents list page
- [ ] Agent details page
- [ ] Agent cards component

**Semaine 3-4**:
- [ ] Marketplace page
- [ ] Template cards
- [ ] Install flow

**Semaine 4-5**:
- [ ] Analytics dashboard
- [ ] Stats cards

**Semaine 5-6**:
- [ ] Real-time WebSocket updates
- [ ] Toast notifications
- [ ] Polish & responsive

---

## 🔧 Environment Variables

**Add to `.env.local`**:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

---

**START NOW! Copy-paste and go! 🚀**

# 🗺️ Roadmap Frontend skybot-inbox-ui - Antigravity

**Pour**: Valentin (projet skybot-inbox-ui frontend)
**Responsable**: Antigravity (Claude Frontend)
**Stack**: Next.js 16 + shadcn/ui + TailwindCSS + TypeScript
**Durée**: 4-6 semaines
**Objectif**: Dashboard complet pour gérer agents, voir analytics, marketplace

---

## 🎯 Vue d'Ensemble

**État actuel**: Frontend basique (inbox, conversations, analytics simple)
**État cible**: Plateforme complète avec agents marketplace, monitoring, configuration
**ROI**: Interface visuelle pour gérer 50+ agents sans toucher au code

---

## 📊 Audit Rapide Architecture Actuelle

**Pages existantes** (`src/app/[locale]/`):
- ✅ Dashboard (basique)
- ✅ Inbox & Conversations
- ✅ Analytics (simple charts)
- ✅ CRM
- ✅ Calendar
- ✅ Settings
- ✅ Account

**Composants shadcn/ui installés**:
- avatar, badge, button, input, textarea
- scroll-area, separator, sidebar
- loading-skeletons, empty-state, error-state

**Ce qui manque**:
- ❌ **Page Agents** (liste, configure, monitor)
- ❌ **Marketplace Templates**
- ❌ **Agent Configuration Forms**
- ❌ **Analytics Avancées** (par agent)
- ❌ **Real-time Status** (WebSocket)
- ❌ **Agent Builder** (no-code)

**Composants shadcn/ui à installer**:
- card, dialog, dropdown-menu, tabs
- table, pagination, toast
- switch, select, label, form
- chart (recharts), badge, progress
- alert-dialog, sheet, popover

---

## 📅 Phase 1: Infrastructure & Setup (Semaine 1)

### Task 1.1: Installer Composants shadcn/ui Manquants (1 jour)

```bash
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

**Livrables**:
- [ ] Tous composants installés
- [ ] Test storybook (optionnel)

---

### Task 1.2: API Client Setup (2 jours)

**Créer** `src/lib/api/agents.ts`:

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pour JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const agentsApi = {
  // List agents
  getAll: (filters?: AgentFilters) =>
    apiClient.get('/agents', { params: filters }),

  // Get agent details
  getOne: (id: string) => apiClient.get(`/agents/${id}`),

  // Create from template
  createFromTemplate: (data: CreateAgentDto) =>
    apiClient.post('/agents/from-template', data),

  // Toggle status
  toggleStatus: (id: string) =>
    apiClient.put(`/agents/${id}/toggle`),

  // Get stats
  getStats: (id: string, period?: string) =>
    apiClient.get(`/agents/${id}/stats`, { params: { period } }),

  // Get logs
  getLogs: (id: string, pagination: Pagination) =>
    apiClient.get(`/agents/${id}/logs`, { params: pagination }),

  // Delete
  delete: (id: string) => apiClient.delete(`/agents/${id}`),
};

export const templatesApi = {
  getAll: (filters?: TemplateFilters) =>
    apiClient.get('/templates', { params: filters }),

  getBySlug: (slug: string) =>
    apiClient.get(`/templates/${slug}`),
};

export const analyticsApi = {
  getOverview: () => apiClient.get('/analytics/agents/overview'),

  getPerformance: (id: string, period: string) =>
    apiClient.get(`/analytics/agents/${id}/performance`, {
      params: { period },
    }),

  getCosts: () => apiClient.get('/analytics/costs'),

  getHealth: () => apiClient.get('/analytics/health'),
};
```

**Types** `src/types/agents.ts`:

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

export interface AgentStats {
  agent: {
    id: string;
    name: string;
    status: AgentStatus;
  };
  stats: {
    totalExecutions: number;
    successCount: number;
    errorCount: number;
    successRate: number;
    avgResponseTime: number;
    totalOpenAITokens: number;
    totalOpenAICost: number;
  };
  executions: AgentExecution[];
}
```

**Livrables**:
- [ ] API client complet
- [ ] Types TypeScript
- [ ] Error handling
- [ ] Tests (optionnel)

---

### Task 1.3: WebSocket Client (2 jours)

**Créer** `src/lib/websocket/agents-socket.ts`:

```typescript
import { io, Socket } from 'socket.io-client';

class AgentsSocket {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(process.env.NEXT_PUBLIC_WS_URL || '', {
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

**React Hook** `src/hooks/useAgentsWebSocket.ts`:

```typescript
import { useEffect } from 'react';
import { agentsSocket } from '@/lib/websocket/agents-socket';
import { useAuth } from '@/hooks/useAuth';

export function useAgentsWebSocket() {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const socket = agentsSocket.connect(token);

    return () => {
      agentsSocket.disconnect();
    };
  }, [token]);

  return {
    subscribeToAgent: agentsSocket.subscribeToAgent.bind(agentsSocket),
    onAgentStatusChange:
      agentsSocket.onAgentStatusChange.bind(agentsSocket),
    onAgentExecution: agentsSocket.onAgentExecution.bind(agentsSocket),
  };
}
```

**Livrables**:
- [ ] WebSocket client
- [ ] React hooks
- [ ] Tests connexion

---

## 📅 Phase 2: Page Agents (Semaine 2-3)

### Task 2.1: Agents List Page (3 jours)

**Créer** `src/app/[locale]/agents/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { agentsApi } from '@/lib/api/agents';
import { Agent, AgentType } from '@/types/agents';
import { AgentCard } from '@/components/agents/agent-card';
import { AgentFilters } from '@/components/agents/agent-filters';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadAgents();
  }, [filters]);

  async function loadAgents() {
    try {
      setLoading(true);
      const { data } = await agentsApi.getAll(filters);
      setAgents(data);
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-muted-foreground">
            Manage your AI agents
          </p>
        </div>
        <Link href="/agents/marketplace">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Agent
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <AgentFilters
        filters={filters}
        onChange={setFilters}
        className="mb-6"
      />

      {/* Agents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <AgentCardSkeleton key={i} />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <EmptyState
          title="No agents yet"
          description="Get started by adding agents from the marketplace"
          action={
            <Link href="/agents/marketplace">
              <Button>Browse Marketplace</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onToggle={() => handleToggle(agent.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Composant** `src/components/agents/agent-card.tsx`:

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
import { MoreVertical, Activity, AlertCircle } from 'lucide-react';
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
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{agent.name}</CardTitle>
            <CardDescription className="mt-1">
              {agent.description || 'No description'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href={`/agents/${agent.id}`}>View Details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Configure</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  statusColors[agent.status]
                }`}
              />
              <span className="text-sm font-medium">{agent.status}</span>
            </div>
          </div>

          {/* Type */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <Badge variant="secondary">{agent.type}</Badge>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Executions
            </span>
            <span className="text-sm font-medium">
              {agent.executionCount.toLocaleString()}
            </span>
          </div>

          {/* Errors */}
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
            <Switch
              checked={agent.status === 'ACTIVE'}
              onCheckedChange={onToggle}
            />
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

**Livrables Task 2.1**:
- [ ] Page agents list
- [ ] AgentCard component
- [ ] AgentFilters component
- [ ] Responsive design
- [ ] Loading states
- [ ] Empty states

---

### Task 2.2: Agent Details Page (3 jours)

**Créer** `src/app/[locale]/agents/[id]/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { agentsApi, analyticsApi } from '@/lib/api/agents';
import { Agent, AgentStats } from '@/types/agents';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentOverview } from '@/components/agents/agent-overview';
import { AgentMetrics } from '@/components/agents/agent-metrics';
import { AgentLogs } from '@/components/agents/agent-logs';
import { AgentConfig } from '@/components/agents/agent-config';

export default function AgentDetailsPage() {
  const params = useParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
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

  if (loading) return <AgentDetailsSkeleton />;
  if (!agent) return <NotFound />;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <AgentHeader agent={agent} />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AgentOverview agent={agent} stats={stats} />
        </TabsContent>

        <TabsContent value="metrics">
          <AgentMetrics agentId={agent.id} />
        </TabsContent>

        <TabsContent value="logs">
          <AgentLogs agentId={agent.id} />
        </TabsContent>

        <TabsContent value="config">
          <AgentConfig agent={agent} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Composant Metrics avec Recharts**:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api/agents';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AgentMetricsProps {
  agentId: string;
}

export function AgentMetrics({ agentId }: AgentMetricsProps) {
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadMetrics();
  }, [agentId, period]);

  async function loadMetrics() {
    const { data } = await analyticsApi.getPerformance(agentId, period);
    setData(data);
  }

  if (!data) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-end">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Executions Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Executions Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.executions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                name="Executions"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Response Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Average Response Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.responseTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgTime" fill="#82ca9d" name="Avg Time (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Error Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Success vs Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.successRate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="success"
                stroke="#82ca9d"
                name="Success"
              />
              <Line
                type="monotone"
                dataKey="error"
                stroke="#ff6b6b"
                name="Errors"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Livrables Task 2.2**:
- [ ] Agent details page
- [ ] Tabs navigation
- [ ] Metrics avec charts
- [ ] Logs table
- [ ] Config form

---

## 📅 Phase 3: Marketplace (Semaine 3-4)

### Task 3.1: Templates Marketplace (4 jours)

**Page** `src/app/[locale]/agents/marketplace/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { templatesApi } from '@/lib/api/agents';
import { AgentTemplate } from '@/types/agents';
import { TemplateCard } from '@/components/agents/template-card';
import { TemplateFilters } from '@/components/agents/template-filters';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function MarketplacePage() {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});

  useEffect(() => {
    loadTemplates();
  }, [filters]);

  async function loadTemplates() {
    const { data } = await templatesApi.getAll(filters);
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

      {/* Search & Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <TemplateFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
```

**TemplateCard Component**:

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
import { Star, Download, DollarSign } from 'lucide-react';
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
          {template.isPremium && (
            <Badge variant="default" className="bg-yellow-500">
              <DollarSign className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Category */}
          <Badge variant="secondary">{template.category}</Badge>

          {/* Rating */}
          {template.avgRating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">
                {template.avgRating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Installs */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Download className="h-4 w-4" />
            <span className="text-sm">
              {template.installCount.toLocaleString()} installs
            </span>
          </div>

          {/* Use Cases */}
          <div>
            <p className="text-sm font-medium mb-1">Use Cases:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {template.useCases.slice(0, 2).map((useCase, i) => (
                <li key={i}>• {useCase}</li>
              ))}
            </ul>
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

**Template Details Page** `src/app/[locale]/agents/marketplace/[slug]/page.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { templatesApi, agentsApi } from '@/lib/api/agents';
import { AgentTemplate } from '@/types/agents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfigurationForm } from '@/components/agents/configuration-form';
import { ArrowLeft, Download, Star } from 'lucide-react';

export default function TemplateDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<AgentTemplate | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, [params.slug]);

  async function loadTemplate() {
    const { data } = await templatesApi.getBySlug(params.slug as string);
    setTemplate(data);
  }

  async function handleInstall(config: any) {
    try {
      setInstalling(true);
      await agentsApi.createFromTemplate({
        templateSlug: params.slug as string,
        config,
      });
      router.push('/agents');
    } catch (error) {
      console.error('Installation error:', error);
    } finally {
      setInstalling(false);
    }
  }

  if (!template) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Marketplace
      </Button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">{template.name}</h1>
          <p className="text-xl text-muted-foreground">
            {template.description}
          </p>
          <div className="flex items-center gap-4 mt-4">
            <Badge>{template.category}</Badge>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{template.avgRating?.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>{template.installCount} installs</span>
            </div>
          </div>
        </div>
        {template.isPremium && (
          <div className="text-right">
            <p className="text-3xl font-bold">${template.pricing}</p>
            <p className="text-sm text-muted-foreground">per month</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="install">Install</TabsTrigger>
          <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="prose max-w-none">
            <h2>Use Cases</h2>
            <ul>
              {template.useCases.map((useCase, i) => (
                <li key={i}>{useCase}</li>
              ))}
            </ul>

            <h2>Features</h2>
            {/* Parse from template data */}

            <h2>Requirements</h2>
            <p>Required Airtable tables:</p>
            <ul>
              {template.requiredTables.map((table, i) => (
                <li key={i}><code>{table}</code></li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="install">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Configuration</h2>
            <ConfigurationForm
              template={template}
              onSubmit={handleInstall}
              submitting={installing}
            />
          </div>
        </TabsContent>

        <TabsContent value="screenshots">
          <div className="grid grid-cols-2 gap-4">
            {template.screenshots.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Screenshot ${i + 1}`}
                className="rounded-lg border"
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Livrables Task 3.1**:
- [ ] Marketplace page
- [ ] Template card component
- [ ] Template details page
- [ ] Install flow
- [ ] Configuration form

---

## 📅 Phase 4: Analytics Dashboard (Semaine 4-5)

### Task 4.1: Global Analytics Page (3 jours)

**Page** `src/app/[locale]/analytics/agents/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api/agents';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { TopAgentsTable } from '@/components/analytics/top-agents-table';
import { CostsBreakdown } from '@/components/analytics/costs-breakdown';
import { HealthStatus } from '@/components/analytics/health-status';

export default function AgentsAnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    const { data } = await analyticsApi.getOverview();
    setOverview(data);
  }

  if (!overview) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Agents Analytics</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Agents
            </CardTitle>
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
            <p className="text-xs text-muted-foreground">
              {overview.executionsGrowth}% from yesterday
            </p>
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
            <div className="text-2xl font-bold">
              {overview.avgResponseTime}s
            </div>
            <p className="text-xs text-muted-foreground">
              -12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.errorRate}%</div>
            <p className="text-xs text-green-600">+0.5% improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopAgentsTable agents={overview.topAgents} />
        <CostsBreakdown />
      </div>

      <div className="mt-6">
        <HealthStatus />
      </div>
    </div>
  );
}
```

**Livrables Task 4.1**:
- [ ] Analytics dashboard
- [ ] Stats cards
- [ ] Top agents table
- [ ] Costs breakdown
- [ ] Health status

---

### Task 4.2: Real-Time Updates (2 jours)

**Intégrer WebSocket dans dashboard**:

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
    // Listen to status changes
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

    // Listen to executions
    onAgentExecution((data) => {
      // Update execution count in real-time
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

**Livrables Task 4.2**:
- [ ] WebSocket integration
- [ ] Real-time status updates
- [ ] Toast notifications
- [ ] Auto-refresh data

---

## 📅 Phase 5: Advanced Features (Semaine 5-6)

### Task 5.1: Agent Builder (No-Code) (4 jours)

**Page** `src/app/[locale]/agents/builder/page.tsx`:

Simple form builder pour créer custom agents visuellement.

**Fonctionnalités**:
- Drag & drop workflow builder
- Configure prompts
- Select triggers
- Map data sources

**Livrables**:
- [ ] Visual builder interface
- [ ] Prompt editor
- [ ] Workflow preview
- [ ] Save & deploy

---

### Task 5.2: Configuration Forms Dynamic (3 jours)

**Générer forms depuis JSON Schema**:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface ConfigurationFormProps {
  template: AgentTemplate;
  onSubmit: (data: any) => void;
  submitting: boolean;
}

export function ConfigurationForm({
  template,
  onSubmit,
  submitting,
}: ConfigurationFormProps) {
  // Generate Zod schema from JSON Schema
  const schema = generateZodSchema(template.configSchema);
  const form = useForm({ resolver: zodResolver(schema) });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {renderFields(template.configSchema, form)}

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Installing...' : 'Install Agent'}
      </Button>
    </form>
  );
}

function renderFields(schema: any, form: any) {
  return Object.entries(schema.properties).map(([key, prop]: [string, any]) => {
    if (prop['ui:widget'] === 'select') {
      return (
        <FormField
          key={key}
          control={form.control}
          name={key}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{prop['ui:title']}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {prop.enum.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      );
    }

    // Other field types...
  });
}
```

**Livrables Task 5.2**:
- [ ] Dynamic form generator
- [ ] JSON Schema → Zod
- [ ] UI widgets mapping
- [ ] Validation

---

## 🎯 Objectifs Mesurables

**Fin Phase 1 (Semaine 1)**:
- [ ] Composants shadcn/ui installés
- [ ] API client + types
- [ ] WebSocket client

**Fin Phase 2 (Semaine 3)**:
- [ ] Agents list page
- [ ] Agent details page
- [ ] Real-time updates

**Fin Phase 3 (Semaine 4)**:
- [ ] Marketplace complet
- [ ] Template details
- [ ] Install flow

**Fin Phase 4 (Semaine 5)**:
- [ ] Analytics dashboard
- [ ] Charts & metrics
- [ ] Real-time monitoring

**Fin Phase 5 (Semaine 6)**:
- [ ] Agent builder (bonus)
- [ ] Dynamic config forms
- [ ] Documentation complète

---

## 📊 KPIs de Succès

1. **Performance**: Page load <2s
2. **Responsive**: Mobile-first design
3. **Accessibility**: WCAG AA compliant
4. **UX**: Intuitive, 0 formation required
5. **Real-time**: WebSocket latency <100ms

---

## 🤝 Coordination

**Avec Backend skybot-inbox**:
- Consommer API endpoints
- WebSocket connection
- Authentication JWT

**Avec SkyBot**:
- Afficher catalogue templates
- Trigger deployments
- Show metrics

---

## 🎉 Résultat Final

**Après 6 semaines**:
- ✅ Interface complète agents management
- ✅ Marketplace 50+ templates
- ✅ Analytics temps réel
- ✅ Configuration no-code
- ✅ Monitoring dashboard
- ✅ Agent builder visual

**Business Impact**:
- Clients peuvent gérer agents sans coder
- Installation agents en 1 clic
- Visibilité complète sur performance
- UX moderne & intuitive

---

**Next Steps**: Commencer Phase 1 - Setup infrastructure! 🚀

# 🗺️ Roadmap Backend skybot-inbox - FINAL

**Pour**: Claude Backend skybot-inbox
**Stack**: NestJS + PostgreSQL + Prisma + Airtable
**Durée**: 6 semaines
**Start Date**: 27 janvier 2026

---

## 🎯 Mission

Créer API complète pour gérer agents, analytics, et intégration SkyBot.

---

## 📅 SEMAINE 1-2: Agents Management Core

### ✅ TASK 1: Prisma Schema (Jour 1-2)

**Ajouter dans `prisma/schema.prisma`**:

```prisma
model Agent {
  id                String   @id @default(uuid())
  externalId        String   @unique
  name              String
  type              AgentType
  category          AgentCategory
  description       String?
  status            AgentStatus @default(INACTIVE)
  version           String   @default("1.0.0")

  accountId         String
  account           Account  @relation(fields: [accountId], references: [id])

  templateSource    String?
  configJson        Json?
  airtableBaseId    String?
  n8nWorkflowId     String?

  isActive          Boolean  @default(false)
  lastExecutedAt    DateTime?
  executionCount    Int      @default(0)
  errorCount        Int      @default(0)
  avgResponseTimeMs Float?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deployedAt        DateTime?

  executions        AgentExecution[]
  logs              AgentLog[]

  @@index([accountId])
  @@index([status])
  @@index([type])
}

enum AgentType {
  SALES
  SUPPORT
  ANALYTICS
  MARKETING
  HR
  FINANCE
  LEGAL
  OPERATIONS
  DEVOPS
  CONTENT
  INTERNAL
  CUSTOM
}

enum AgentCategory {
  CORE
  SPECIALIZED
  TEMPLATE
}

enum AgentStatus {
  ACTIVE
  INACTIVE
  DEPLOYING
  ERROR
  MAINTENANCE
}

model AgentExecution {
  id                String   @id @default(uuid())
  agentId           String
  agent             Agent    @relation(fields: [agentId], references: [id])

  inputMessage      String?
  outputMessage     String?
  status            ExecutionStatus
  processingTimeMs  Int?
  errorMessage      String?

  openaiTokensUsed  Int?
  openaiCost        Float?

  conversationId    String?
  contactId         String?

  createdAt         DateTime @default(now())

  @@index([agentId])
  @@index([status])
  @@index([createdAt])
}

enum ExecutionStatus {
  SUCCESS
  ERROR
  TIMEOUT
  PENDING
}

model AgentLog {
  id          String   @id @default(uuid())
  agentId     String
  agent       Agent    @relation(fields: [agentId], references: [id])

  level       LogLevel
  message     String
  metadata    Json?

  createdAt   DateTime @default(now())

  @@index([agentId])
  @@index([level])
  @@index([createdAt])
}

enum LogLevel {
  INFO
  WARN
  ERROR
  DEBUG
}

model AgentTemplate {
  id              String   @id @default(uuid())
  slug            String   @unique
  name            String
  description     String
  category        AgentType
  version         String   @default("1.0.0")

  templatePath    String
  configSchema    Json?
  requiredTables  String[]

  iconUrl         String?
  screenshots     String[]
  useCases        String[]
  isPremium       Boolean  @default(false)
  pricing         Float?

  installCount    Int      @default(0)
  avgRating       Float?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([category])
  @@index([isPremium])
}
```

**Exécuter**:
```bash
npx prisma migrate dev --name add_agents_system
npx prisma generate
```

---

### ✅ TASK 2: Agents Module (Jour 3-7)

**Créer** `src/agents/agents.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AgentsService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async findAll(accountId: string, filters?: any) {
    return this.prisma.agent.findMany({
      where: {
        accountId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.type && { type: filters.type }),
      },
      include: {
        _count: {
          select: { executions: true, logs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, accountId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, accountId },
      include: {
        _count: {
          select: { executions: true, logs: true },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  async createFromTemplate(
    accountId: string,
    templateSlug: string,
    config?: any,
  ) {
    const template = await this.prisma.agentTemplate.findUnique({
      where: { slug: templateSlug },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Deploy to SkyBot
    const deployment = await this.deploySkyBotAgent(
      accountId,
      template.templatePath,
      config,
    );

    return this.prisma.agent.create({
      data: {
        externalId: deployment.n8nWorkflowId,
        name: template.name,
        type: template.category,
        category: 'TEMPLATE',
        description: template.description,
        accountId,
        templateSource: template.templatePath,
        configJson: config,
        n8nWorkflowId: deployment.n8nWorkflowId,
        deployedAt: new Date(),
        status: 'ACTIVE',
        isActive: true,
      },
    });
  }

  async toggleStatus(id: string, accountId: string) {
    const agent = await this.findOne(id, accountId);

    const newStatus = agent.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    await this.toggleN8NWorkflow(agent.n8nWorkflowId, newStatus === 'ACTIVE');

    return this.prisma.agent.update({
      where: { id },
      data: {
        status: newStatus,
        isActive: newStatus === 'ACTIVE',
      },
    });
  }

  async getStats(id: string, accountId: string, period: string = '7d') {
    const agent = await this.findOne(id, accountId);

    const executions = await this.prisma.agentExecution.findMany({
      where: {
        agentId: id,
        createdAt: {
          gte: this.getDateFromPeriod(period),
        },
      },
    });

    const successCount = executions.filter((e) => e.status === 'SUCCESS').length;
    const errorCount = executions.filter((e) => e.status === 'ERROR').length;
    const totalTokens = executions.reduce((sum, e) => sum + (e.openaiTokensUsed || 0), 0);
    const totalCost = executions.reduce((sum, e) => sum + (e.openaiCost || 0), 0);

    return {
      agent: {
        id: agent.id,
        name: agent.name,
        status: agent.status,
      },
      stats: {
        totalExecutions: executions.length,
        successCount,
        errorCount,
        successRate:
          executions.length > 0 ? (successCount / executions.length) * 100 : 0,
        avgResponseTime:
          executions.reduce((sum, e) => sum + (e.processingTimeMs || 0), 0) /
          executions.length,
        totalOpenAITokens: totalTokens,
        totalOpenAICost: totalCost,
      },
      executions: executions.slice(0, 10),
    };
  }

  async logExecution(data: any) {
    return this.prisma.agentExecution.create({
      data: {
        agentId: data.agentId,
        inputMessage: data.input,
        outputMessage: data.output,
        status: data.status,
        processingTimeMs: data.processingTime,
        errorMessage: data.error,
        openaiTokensUsed: data.tokensUsed,
        openaiCost: data.cost,
        conversationId: data.conversationId,
      },
    });
  }

  async remove(id: string, accountId: string) {
    const agent = await this.findOne(id, accountId);

    // Deactivate in N8N
    await this.toggleN8NWorkflow(agent.n8nWorkflowId, false);

    return this.prisma.agent.delete({
      where: { id },
    });
  }

  private async deploySkyBotAgent(
    accountId: string,
    templatePath: string,
    config: any,
  ) {
    const skybotUrl = process.env.SKYBOT_GATEWAY_URL;
    const response = await this.httpService.axiosRef.post(
      `${skybotUrl}/api/agents/deploy`,
      {
        accountId,
        templatePath,
        config,
      },
    );
    return response.data;
  }

  private async toggleN8NWorkflow(workflowId: string, active: boolean) {
    const n8nUrl = process.env.N8N_URL;
    const n8nKey = process.env.N8N_API_KEY;

    await this.httpService.axiosRef.post(
      `${n8nUrl}/api/v1/workflows/${workflowId}/${active ? 'activate' : 'deactivate'}`,
      {},
      { headers: { 'X-N8N-API-KEY': n8nKey } },
    );
  }

  private getDateFromPeriod(period: string): Date {
    const now = new Date();
    const match = period.match(/(\d+)([dwm])/);
    if (!match) return new Date(0);

    const value = parseInt(match[1]);
    const unit = match[2];

    if (unit === 'd') {
      now.setDate(now.getDate() - value);
    } else if (unit === 'w') {
      now.setDate(now.getDate() - value * 7);
    } else if (unit === 'm') {
      now.setMonth(now.getMonth() - value);
    }

    return now;
  }
}
```

**Créer** `src/agents/agents.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgentsService } from './agents.service';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  @Get()
  async findAll(@Request() req, @Query() filters: any) {
    return this.agentsService.findAll(req.user.accountId, filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.agentsService.findOne(id, req.user.accountId);
  }

  @Post('from-template')
  async createFromTemplate(@Request() req, @Body() dto: any) {
    return this.agentsService.createFromTemplate(
      req.user.accountId,
      dto.templateSlug,
      dto.config,
    );
  }

  @Put(':id/toggle')
  async toggleStatus(@Param('id') id: string, @Request() req) {
    return this.agentsService.toggleStatus(id, req.user.accountId);
  }

  @Get(':id/stats')
  async getStats(
    @Param('id') id: string,
    @Request() req,
    @Query('period') period?: string,
  ) {
    return this.agentsService.getStats(id, req.user.accountId, period);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.agentsService.remove(id, req.user.accountId);
  }
}
```

**Créer** `src/agents/agents.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
```

**Ajouter dans `src/app.module.ts`**:

```typescript
import { AgentsModule } from './agents/agents.module';

@Module({
  imports: [
    // ... existing imports
    AgentsModule,
  ],
})
export class AppModule {}
```

---

### ✅ TASK 3: Templates Module (Jour 8-10)

**Créer** `src/templates/templates.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class TemplatesService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async findAll(filters?: any) {
    return this.prisma.agentTemplate.findMany({
      where: {
        ...(filters?.category && { category: filters.category }),
        ...(filters?.isPremium !== undefined && {
          isPremium: filters.isPremium,
        }),
      },
      orderBy: [{ installCount: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findBySlug(slug: string) {
    const template = await this.prisma.agentTemplate.findUnique({
      where: { slug },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async seedFromSkyBot() {
    const skybotUrl = process.env.SKYBOT_GATEWAY_URL;
    const response = await this.httpService.axiosRef.get(
      `${skybotUrl}/api/agents/templates`,
    );

    const templates = response.data;

    for (const tpl of templates) {
      await this.prisma.agentTemplate.upsert({
        where: { slug: tpl.slug },
        update: tpl,
        create: tpl,
      });
    }

    return { imported: templates.length };
  }
}
```

**Créer** `src/templates/templates.controller.ts`:

```typescript
import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Get()
  async findAll(@Query() filters: any) {
    return this.templatesService.findAll(filters);
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return this.templatesService.findBySlug(slug);
  }

  @Post('seed')
  @UseGuards(JwtAuthGuard)
  async seed() {
    return this.templatesService.seedFromSkyBot();
  }
}
```

---

## 📅 SEMAINE 3-4: Analytics & Real-Time

### ✅ TASK 4: Analytics API (Jour 11-14)

**Créer** `src/analytics/agents-analytics.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgentsAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(accountId: string) {
    const agents = await this.prisma.agent.findMany({
      where: { accountId },
      include: {
        _count: {
          select: { executions: true },
        },
      },
    });

    const totalAgents = agents.length;
    const activeAgents = agents.filter((a) => a.status === 'ACTIVE').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const executionsToday = await this.prisma.agentExecution.count({
      where: {
        agent: { accountId },
        createdAt: { gte: today },
      },
    });

    const avgResponseTime = await this.prisma.agentExecution.aggregate({
      where: {
        agent: { accountId },
        createdAt: { gte: today },
      },
      _avg: {
        processingTimeMs: true,
      },
    });

    const errorRate =
      executionsToday > 0
        ? (
            (await this.prisma.agentExecution.count({
              where: {
                agent: { accountId },
                createdAt: { gte: today },
                status: 'ERROR',
              },
            })) / executionsToday
          ) * 100
        : 0;

    const topAgents = agents
      .sort((a, b) => b._count.executions - a._count.executions)
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        name: a.name,
        executions: a._count.executions,
      }));

    return {
      totalAgents,
      activeAgents,
      totalExecutionsToday: executionsToday,
      avgResponseTime: (avgResponseTime._avg.processingTimeMs || 0) / 1000,
      errorRate: errorRate.toFixed(2),
      topAgents,
    };
  }

  async getCosts(accountId: string) {
    const costs = await this.prisma.agentExecution.groupBy({
      by: ['agentId'],
      where: {
        agent: { accountId },
      },
      _sum: {
        openaiCost: true,
        openaiTokensUsed: true,
      },
    });

    return costs.map((c) => ({
      agentId: c.agentId,
      totalCost: c._sum.openaiCost || 0,
      totalTokens: c._sum.openaiTokensUsed || 0,
    }));
  }
}
```

---

### ✅ TASK 5: WebSocket Gateway (Jour 15-18)

**Installer**:
```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

**Créer** `src/agents/agents.gateway.ts`:

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class AgentsGateway {
  @WebSocketServer()
  server: Server;

  emitAgentStatusChange(agentId: string, status: string) {
    this.server.emit('agent:status', { agentId, status });
  }

  emitAgentExecution(execution: any) {
    this.server.emit('agent:execution', execution);
  }

  @SubscribeMessage('subscribe:agent')
  handleSubscribeAgent(client: Socket, agentId: string) {
    client.join(`agent:${agentId}`);
  }
}
```

---

## 📅 SEMAINE 5: Integration SkyBot

### ✅ TASK 6: Webhooks (Jour 19-21)

**Créer** `src/webhooks/skybot-webhook.controller.ts`:

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AgentsService } from '../agents/agents.service';
import { AgentsGateway } from '../agents/agents.gateway';

@Controller('webhooks/skybot')
export class SkybotWebhookController {
  constructor(
    private agentsService: AgentsService,
    private agentsGateway: AgentsGateway,
  ) {}

  @Post('agent-execution')
  async handleAgentExecution(@Body() data: any) {
    const execution = await this.agentsService.logExecution({
      agentId: data.agentId,
      input: data.input,
      output: data.output,
      status: data.status,
      processingTime: data.processingTime,
      tokensUsed: data.tokensUsed,
      cost: data.cost,
    });

    this.agentsGateway.emitAgentExecution(execution);

    return { received: true };
  }

  @Post('agent-error')
  async handleAgentError(@Body() data: any) {
    // Log error
    return { received: true };
  }
}
```

---

## 📅 SEMAINE 6: Polish & Testing

### ✅ TASK 7: Tests (Jour 22-25)

**Créer tests unitaires pour chaque service**

**Exemple** `src/agents/agents.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AgentsService } from './agents.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AgentsService', () => {
  let service: AgentsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentsService, PrismaService],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of agents', async () => {
      const result = [];
      jest.spyOn(prisma.agent, 'findMany').mockResolvedValue(result);

      expect(await service.findAll('account-id')).toBe(result);
    });
  });
});
```

---

## 🔧 Variables d'Environnement

**Ajouter dans `.env`**:

```env
# SkyBot Integration
SKYBOT_GATEWAY_URL=https://skybot.onrender.com
SKYBOT_API_KEY=sk_xxx

# N8N
N8N_URL=https://vmilliand.app.n8n.cloud
N8N_API_KEY=n8n_xxx

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/skybot_inbox

# JWT
JWT_SECRET=your-secret-key
```

---

## ✅ Checklist Finale

**Semaine 1-2**:
- [ ] Prisma migration executed
- [ ] Agents module créé
- [ ] Templates module créé
- [ ] API endpoints testés

**Semaine 3-4**:
- [ ] Analytics service
- [ ] WebSocket gateway
- [ ] Real-time updates

**Semaine 5**:
- [ ] Webhooks SkyBot
- [ ] Integration bidirectionnelle

**Semaine 6**:
- [ ] Tests unitaires >80%
- [ ] Documentation Swagger
- [ ] Production ready

---

**START NOW! Copy-paste ce code et go! 🚀**

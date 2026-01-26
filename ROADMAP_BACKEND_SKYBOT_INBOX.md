# 🗺️ Roadmap Backend skybot-inbox - Claude 2

**Pour**: Valentin (projet skybot-inbox backend)
**Responsable**: Claude Backend skybot-inbox
**Stack**: NestJS + PostgreSQL + Prisma + Airtable
**Durée**: 4-6 semaines
**Objectif**: API complète pour gérer agents, analytics, et intégration SkyBot

---

## 🎯 Vue d'Ensemble

**État actuel**: Backend fonctionnel (auth, conversations, messages)
**État cible**: API agents management + analytics + real-time + intégration complète SkyBot
**ROI**: Frontend peut afficher/gérer tous les agents dynamiquement

---

## 📊 Audit Rapide Architecture Actuelle

**Modules existants (bien!):**
- ✅ Auth (JWT + Google OAuth)
- ✅ Accounts & Billing
- ✅ Conversations & Messages
- ✅ Channels & Webhooks
- ✅ Contacts & CRM
- ✅ Inboxes
- ✅ Preferences & Settings
- ✅ Analytics (basique)
- ✅ Airtable integration
- ✅ Agents (existe mais à étendre!)

**Ce qui manque**:
- ❌ **Agents CRUD complet** (list, activate, configure)
- ❌ **Agents Analytics** (métriques par agent)
- ❌ **Agents Logs** (historique exécutions)
- ❌ **Templates Catalog** (liste 50 agents disponibles)
- ❌ **Real-time Updates** (WebSocket pour agents status)

---

## 📅 Phase 1: Agents Management API (Semaine 1-2)

### Task 1.1: Module Agents Complet (5 jours)

**Étendre module existant** `src/agents/`

#### 1.1.1 Schéma Prisma

**Ajouter dans `prisma/schema.prisma`**:

```prisma
model Agent {
  id                String   @id @default(uuid())
  externalId        String   @unique // ID N8N workflow
  name              String
  type              AgentType
  category          AgentCategory
  description       String?
  status            AgentStatus @default(INACTIVE)
  version           String   @default("1.0.0")

  // Relations
  accountId         String
  account           Account  @relation(fields: [accountId], references: [id])

  // Configuration
  templateSource    String?  // Chemin vers template JSON
  configJson        Json?    // Config spécifique
  airtableBaseId    String?
  n8nWorkflowId     String?

  // Métadonnées
  isActive          Boolean  @default(false)
  lastExecutedAt    DateTime?
  executionCount    Int      @default(0)
  errorCount        Int      @default(0)
  avgResponseTimeMs Float?

  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deployedAt        DateTime?

  // Relations
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

  // Données exécution
  inputMessage      String?
  outputMessage     String?
  status            ExecutionStatus
  processingTimeMs  Int?
  errorMessage      String?

  // Coûts
  openaiTokensUsed  Int?
  openaiCost        Float?

  // Context
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

  // Template data
  templatePath    String   // Chemin vers JSON
  configSchema    Json?    // JSON Schema des configs
  requiredTables  String[] // Tables Airtable nécessaires

  // Metadata
  iconUrl         String?
  screenshots     String[]
  useCases        String[]
  isPremium       Boolean  @default(false)
  pricing         Float?

  // Stats
  installCount    Int      @default(0)
  avgRating       Float?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([category])
  @@index([isPremium])
}
```

**Migration**:
```bash
npx prisma migrate dev --name add_agents_system
```

---

#### 1.1.2 Service Agents

**Créer/Étendre** `src/agents/agents.service.ts`:

```typescript
@Injectable()
export class AgentsService {
  constructor(
    private prisma: PrismaService,
    private airtable: AirtableService,
    private httpService: HttpService,
  ) {}

  /**
   * Lister tous les agents d'un compte
   */
  async findAll(accountId: string, filters?: AgentFilters) {
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

  /**
   * Créer un agent depuis un template
   */
  async createFromTemplate(
    accountId: string,
    templateSlug: string,
    config?: any,
  ) {
    // 1. Récupérer template
    const template = await this.prisma.agentTemplate.findUnique({
      where: { slug: templateSlug },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // 2. Appeler SkyBot Gateway pour déployer
    const deployment = await this.deploySkyBotAgent(
      accountId,
      template.templatePath,
      config,
    );

    // 3. Créer record agent
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
      },
    });
  }

  /**
   * Activer/Désactiver agent
   */
  async toggleStatus(id: string, accountId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, accountId },
    });

    if (!agent) throw new NotFoundException();

    const newStatus =
      agent.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    // Appeler N8N API pour activer/désactiver
    await this.toggleN8NWorkflow(agent.n8nWorkflowId, newStatus === 'ACTIVE');

    return this.prisma.agent.update({
      where: { id },
      data: {
        status: newStatus,
        isActive: newStatus === 'ACTIVE',
      },
    });
  }

  /**
   * Statistiques agent
   */
  async getStats(id: string, accountId: string, period: string = '7d') {
    const agent = await this.prisma.agent.findFirst({
      where: { id, accountId },
      include: {
        executions: {
          where: {
            createdAt: {
              gte: this.getDateFromPeriod(period),
            },
          },
        },
      },
    });

    if (!agent) throw new NotFoundException();

    const successCount = agent.executions.filter(
      (e) => e.status === 'SUCCESS',
    ).length;
    const errorCount = agent.executions.filter(
      (e) => e.status === 'ERROR',
    ).length;
    const totalTokens = agent.executions.reduce(
      (sum, e) => sum + (e.openaiTokensUsed || 0),
      0,
    );
    const totalCost = agent.executions.reduce(
      (sum, e) => sum + (e.openaiCost || 0),
      0,
    );

    return {
      agent: {
        id: agent.id,
        name: agent.name,
        status: agent.status,
      },
      stats: {
        totalExecutions: agent.executions.length,
        successCount,
        errorCount,
        successRate:
          agent.executions.length > 0
            ? (successCount / agent.executions.length) * 100
            : 0,
        avgResponseTime:
          agent.executions.reduce(
            (sum, e) => sum + (e.processingTimeMs || 0),
            0,
          ) / agent.executions.length,
        totalOpenAITokens: totalTokens,
        totalOpenAICost: totalCost,
      },
      executions: agent.executions.slice(0, 10), // 10 dernières
    };
  }

  /**
   * Logger exécution agent
   */
  async logExecution(data: LogExecutionDto) {
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

  /**
   * Appeler SkyBot Gateway pour déployer agent
   */
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

  /**
   * Toggle N8N workflow
   */
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

---

#### 1.1.3 Controller Agents

**Créer/Étendre** `src/agents/agents.controller.ts`:

```typescript
@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  @Get()
  async findAll(@Request() req, @Query() filters: AgentFiltersDto) {
    return this.agentsService.findAll(req.user.accountId, filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.agentsService.findOne(id, req.user.accountId);
  }

  @Post('from-template')
  async createFromTemplate(
    @Request() req,
    @Body() dto: CreateAgentFromTemplateDto,
  ) {
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

  @Get(':id/logs')
  async getLogs(
    @Param('id') id: string,
    @Request() req,
    @Query() pagination: PaginationDto,
  ) {
    return this.agentsService.getLogs(id, req.user.accountId, pagination);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.agentsService.remove(id, req.user.accountId);
  }
}
```

**Livrables Task 1.1**:
- [ ] Migration Prisma agents
- [ ] Service agents complet
- [ ] Controller agents
- [ ] Tests unitaires (>80% coverage)
- [ ] Doc API (Swagger)

---

### Task 1.2: Templates Catalog API (3 jours)

**Créer module** `src/templates/`

#### Service Templates

```typescript
@Injectable()
export class TemplatesService {
  async findAll(filters?: TemplateFiltersDto) {
    return this.prisma.agentTemplate.findMany({
      where: {
        ...(filters?.category && { category: filters.category }),
        ...(filters?.isPremium !== undefined && {
          isPremium: filters.isPremium,
        }),
      },
      orderBy: [
        { installCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findBySlug(slug: string) {
    const template = await this.prisma.agentTemplate.findUnique({
      where: { slug },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Lire JSON template depuis SkyBot
    const templateData = await this.fetchTemplateJSON(
      template.templatePath,
    );

    return {
      ...template,
      templateData,
    };
  }

  /**
   * Seed templates depuis SkyBot backend
   */
  async seedFromSkyBot() {
    const skybotUrl = process.env.SKYBOT_GATEWAY_URL;
    const response = await axios.get(
      `${skybotUrl}/api/agents/templates`,
    );

    const templates = response.data;

    // Upsert dans DB
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

**Endpoints**:
```typescript
@Controller('templates')
export class TemplatesController {
  @Get()
  async findAll(@Query() filters: TemplateFiltersDto) {
    return this.templatesService.findAll(filters);
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return this.templatesService.findBySlug(slug);
  }

  @Post('seed')
  @UseGuards(AdminGuard)
  async seed() {
    return this.templatesService.seedFromSkyBot();
  }
}
```

**Livrables Task 1.2**:
- [ ] Module templates
- [ ] Seed script depuis SkyBot
- [ ] API CRUD templates
- [ ] Tests

---

## 📅 Phase 2: Analytics & Monitoring (Semaine 3-4)

### Task 2.1: Analytics Dashboard API (4 jours)

**Créer module** `src/analytics/agents-analytics.service.ts`

**Endpoints dashboard**:

```typescript
GET /analytics/agents/overview
→ {
  totalAgents: 47,
  activeAgents: 32,
  totalExecutionsToday: 1245,
  avgResponseTime: 1.2s,
  topAgents: [...],
  errorRate: 2.3%
}

GET /analytics/agents/:id/performance
→ Graphiques temps réel (dernières 24h, 7j, 30j)

GET /analytics/costs
→ Breakdown coûts OpenAI par agent

GET /analytics/health
→ Status santé de tous les agents
```

**Livrables Task 2.1**:
- [ ] Service analytics
- [ ] Endpoints dashboard
- [ ] Cache Redis (optionnel)
- [ ] Tests

---

### Task 2.2: Real-Time Updates WebSocket (4 jours)

**Installer WebSocket dans NestJS**:

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io
```

**Créer Gateway**:

```typescript
@WebSocketGateway({ cors: true })
export class AgentsGateway {
  @WebSocketServer()
  server: Server;

  /**
   * Émettre update quand agent change status
   */
  emitAgentStatusChange(agentId: string, status: AgentStatus) {
    this.server.emit('agent:status', { agentId, status });
  }

  /**
   * Émettre nouvelle exécution
   */
  emitAgentExecution(execution: AgentExecution) {
    this.server.emit('agent:execution', execution);
  }

  @SubscribeMessage('subscribe:agent')
  handleSubscribeAgent(client: Socket, agentId: string) {
    client.join(`agent:${agentId}`);
  }
}
```

**Intégration dans service**:

```typescript
@Injectable()
export class AgentsService {
  constructor(private agentsGateway: AgentsGateway) {}

  async toggleStatus(id: string, accountId: string) {
    // ...code existant...

    // Émettre update temps réel
    this.agentsGateway.emitAgentStatusChange(id, newStatus);

    return updated;
  }
}
```

**Livrables Task 2.2**:
- [ ] WebSocket gateway
- [ ] Events temps réel
- [ ] Doc WebSocket API
- [ ] Tests

---

## 📅 Phase 3: Intégration SkyBot (Semaine 5)

### Task 3.1: Webhooks depuis SkyBot (3 jours)

**Endpoint webhook** pour recevoir events de SkyBot:

```typescript
@Controller('webhooks/skybot')
export class SkybotWebhookController {
  @Post('agent-execution')
  async handleAgentExecution(@Body() data: AgentExecutionWebhookDto) {
    // Logger exécution
    await this.agentsService.logExecution({
      agentId: data.agentId,
      input: data.input,
      output: data.output,
      status: data.status,
      processingTime: data.processingTime,
      tokensUsed: data.tokensUsed,
      cost: data.cost,
    });

    // Émettre WebSocket
    this.agentsGateway.emitAgentExecution(execution);

    return { received: true };
  }

  @Post('agent-error')
  async handleAgentError(@Body() data: AgentErrorWebhookDto) {
    // Logger erreur
    await this.agentsService.logError(data);

    // Alert si critique
    if (data.severity === 'critical') {
      await this.alertsService.sendAlert(data);
    }

    return { received: true };
  }
}
```

**Livrables Task 3.1**:
- [ ] Webhooks endpoints
- [ ] Validation payload
- [ ] Tests webhooks
- [ ] Doc SkyBot integration

---

## 📅 Phase 4: Features Avancées (Semaine 6)

### Task 4.1: Agent Configuration UI-Friendly (3 jours)

**Problème**: Config agents = JSON compliqué
**Solution**: Schema validation + UI hints

**Créer** `config-schema.json` par template:

```json
{
  "type": "object",
  "properties": {
    "language": {
      "type": "string",
      "enum": ["es", "en", "fr"],
      "default": "es",
      "ui:widget": "select",
      "ui:title": "Idioma por defecto"
    },
    "responseTime": {
      "type": "number",
      "minimum": 1,
      "maximum": 10,
      "default": 3,
      "ui:widget": "slider",
      "ui:title": "Tiempo de respuesta (segundos)"
    }
  }
}
```

**API**:
```typescript
GET /templates/:slug/config-schema
→ JSON Schema pour form frontend
```

**Livrables Task 4.1**:
- [ ] Config schemas pour top 10 templates
- [ ] Validation Zod/class-validator
- [ ] API config schema

---

### Task 4.2: Agent Recommendations (2 jours)

**Intelligence artificielle**:
- Analyser usage client
- Recommander agents pertinents

```typescript
@Get('recommendations')
async getRecommendations(@Request() req) {
  // Analyser compte client
  const account = await this.accountsService.findOne(req.user.accountId);

  // Suggérer agents
  const recommendations = await this.recommendationsService.suggest({
    industry: account.industry,
    currentAgents: await this.agentsService.findAll(req.user.accountId),
    usage: await this.analyticsService.getUsage(req.user.accountId),
  });

  return recommendations;
}
```

**Livrables Task 4.2**:
- [ ] Service recommendations
- [ ] Algorithme simple (rule-based)
- [ ] API endpoint

---

## 🎯 Objectifs Mesurables

**Fin Phase 1 (Semaine 2)**:
- [ ] API CRUD agents complète
- [ ] Templates catalog accessible
- [ ] Déploiement agents depuis templates

**Fin Phase 2 (Semaine 4)**:
- [ ] Analytics dashboard data ready
- [ ] WebSocket temps réel fonctionnel
- [ ] Monitoring complet

**Fin Phase 3 (Semaine 5)**:
- [ ] Intégration SkyBot bidirectionnelle
- [ ] Webhooks actifs
- [ ] Logs centralisés

**Fin Phase 4 (Semaine 6)**:
- [ ] Config schemas UI-friendly
- [ ] Recommendations intelligentes
- [ ] Documentation complète

---

## 📊 KPIs de Succès

1. **API Coverage**: 100% endpoints agents documented
2. **Response Time**: API <200ms
3. **WebSocket Latency**: <100ms
4. **Tests Coverage**: >80%
5. **Uptime**: >99.9%

---

## 🤝 Coordination avec Autres Roadmaps

**Avec SkyBot Backend**:
- Recevoir catalogue templates
- Appeler API deploy agents
- Webhooks bidirectionnels

**Avec Frontend**:
- Fournir endpoints API
- WebSocket events
- Config schemas JSON

---

## 📝 Variables d'Environnement

```env
# SkyBot Integration
SKYBOT_GATEWAY_URL=https://skybot.onrender.com
SKYBOT_API_KEY=sk_xxx

# N8N
N8N_URL=https://vmilliand.app.n8n.cloud
N8N_API_KEY=n8n_xxx

# Database
DATABASE_URL=postgresql://...

# Redis (optionnel - caching)
REDIS_URL=redis://...
```

---

## 🎉 Résultat Final

**Après 6 semaines**:
- ✅ API complète agents management
- ✅ Catalogue 50+ templates accessible
- ✅ Analytics temps réel
- ✅ WebSocket updates
- ✅ Intégration SkyBot bidirectionnelle
- ✅ Monitoring & logging centralisé
- ✅ Documentation Swagger complète

**Business Impact**:
- Frontend peut gérer tous agents dynamiquement
- Déploiement agents en 1 clic
- Monitoring temps réel
- Expérience utilisateur optimale

---

**Next Steps**: Commencer Phase 1, Task 1.1 - Prisma migrations! 🚀

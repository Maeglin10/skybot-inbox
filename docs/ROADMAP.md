# SkyBot-Inbox Development Roadmap

> Last Updated: 2026-01-26
> Status: Phase 2 Complete, Phase 3 Ready

---

## Table of Contents

1. [Completed Work](#completed-work)
2. [Phase 3: Advanced Monitoring & Observability](#phase-3-advanced-monitoring--observability)
3. [Phase 4: Performance & Scalability](#phase-4-performance--scalability)
4. [Phase 5: Security Hardening](#phase-5-security-hardening)
5. [Optional: Plugins & API Tierces Ecosystem](#optional-plugins--api-tierces-ecosystem)

---

## Completed Work

### ✅ Phase 1: DevOps Core Infrastructure

**GitHub Actions Workflows:**
- `.github/workflows/ci.yml` - CI pipeline (test, lint, build, coverage)
- `.github/workflows/security.yml` - Security scanning (npm audit, gitleaks)
- `.github/workflows/deploy.yml` - Automated deployment to Render

**Security:**
- Helmet.js configured with CSP headers (`src/main.ts`)
- Enhanced health checks (`/api/health`, `/api/ready`)
- Database backup script (`scripts/backup-database.sh`)

**Audit Logging:**
- `src/common/audit/audit.service.ts` - Audit logging service
- AuditLog model in Prisma schema
- Tracks user actions, IP addresses, user agents

### ✅ Phase 2: RBAC & User Management

**RBAC Implementation:**
- `src/auth/guards/roles.guard.ts` - Role-based access control
- `src/auth/decorators/roles.decorator.ts` - @Roles decorator
- Full enforcement across all protected endpoints

**Admin Module:**
- `src/admin/admin.controller.ts` - User & tenant management
- Full CRUD for users with RBAC enforcement
- Prevents deleting the last admin
- Tenant isolation enforced

**SSO Billing:**
- `src/billing/billing.service.ts` - JWT-based SSO for billing portal
- 5-minute SSO token expiry
- Configuration via `BILLING_PORTAL_URL`, `BILLING_SSO_SECRET`

### ✅ Phase 2B: SkyBot Integration

**SkyBot API Client:**
- `src/agents/skybot-api.client.ts` - Full HTTP client for N8N deployment
- Methods: deployAgent, activateWorkflow, deactivateWorkflow, deleteWorkflow
- Configuration via `SKYBOT_API_URL`, `SKYBOT_API_KEY`

**Agents Service Integration:**
- Automatic deployment to SkyBot on agent creation
- Lifecycle management (activate/deactivate workflows)
- Manual deployment endpoint: `POST /api/agents/:id/deploy-to-skybot`
- Optimized analytics with database aggregations

**Webhooks:**
- `src/webhooks/skybot-webhooks.controller.ts` - Inbound webhooks from SkyBot
- Real-time execution logs and status updates
- WebSocket broadcasting via AgentsGateway

---

## Phase 3: Advanced Monitoring & Observability

**Duration:** 1-2 weeks  
**Priority:** P1

### 3.1 Structured Logging with Winston

**Objective:** Replace console.log with structured JSON logging for production observability.

**Files to Create:**

**`src/common/logger/winston.config.ts`**
```typescript
import * as winston from 'winston';

export const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
  ),
  defaultMeta: {
    service: 'skybot-inbox',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [
    new winston.transports.Console(),
    // Optional: Add file transport for production
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
          }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});
```

**Integration Steps:**
1. Install dependencies:
   ```bash
   npm install winston nest-winston
   ```

2. Update `src/app.module.ts`:
   ```typescript
   import { WinstonModule } from 'nest-winston';
   import { winstonLogger } from './common/logger/winston.config';

   @Module({
     imports: [
       WinstonModule.forRoot({
         instance: winstonLogger,
       }),
       // ... other imports
     ],
   })
   ```

3. Replace console.log throughout codebase:
   ```typescript
   // Before
   console.log('Agent created', agentId);

   // After
   this.logger.info('Agent created', { agentId, accountId });
   ```

**Environment Variables:**
- `LOG_LEVEL` - Log level (debug, info, warn, error) - default: `info`

### 3.2 Application Performance Monitoring (APM)

**Objective:** Integrate APM for request tracing and performance insights.

**Options:**
1. **Sentry** (Recommended for startups)
2. **New Relic**
3. **DataDog**

**Sentry Integration:**

**Install:**
```bash
npm install @sentry/node @sentry/profiling-node
```

**`src/common/sentry/sentry.config.ts`**
```typescript
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export function initializeSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
      integrations: [
        new ProfilingIntegration(),
      ],
    });
  }
}
```

**Update `src/main.ts`:**
```typescript
import { initializeSentry } from './common/sentry/sentry.config';

async function bootstrap() {
  initializeSentry();
  const app = await NestFactory.create(AppModule);
  // ... rest of bootstrap
}
```

**Environment Variables:**
- `SENTRY_DSN` - Sentry Data Source Name (get from Sentry dashboard)
- `SENTRY_TRACES_SAMPLE_RATE` - Percentage of transactions to trace (0.0-1.0) - default: `0.1`
- `SENTRY_PROFILES_SAMPLE_RATE` - Percentage of transactions to profile (0.0-1.0) - default: `0.1`

### 3.3 Metrics & Dashboards

**Objective:** Expose Prometheus metrics for Grafana dashboards.

**Install:**
```bash
npm install @willsoto/nestjs-prometheus prom-client
```

**`src/common/metrics/metrics.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: '/metrics',
    }),
  ],
})
export class MetricsModule {}
```

**Add to `src/app.module.ts`:**
```typescript
imports: [
  // ... other imports
  MetricsModule,
]
```

**Access metrics:** `GET /metrics`

**Recommended Dashboards:**
- Request rate, error rate, duration (RED metrics)
- Database connection pool status
- Agent execution success rate
- WebSocket connection count

---

## Phase 4: Performance & Scalability

**Duration:** 2-3 weeks  
**Priority:** P2

### 4.1 Database Query Optimization

**Objective:** Optimize slow queries and add missing indexes.

**Tasks:**

1. **Enable Prisma Query Logging:**
   ```typescript
   // src/prisma/prisma.service.ts
   const prisma = new PrismaClient({
     log: [
       { emit: 'event', level: 'query' },
       { emit: 'event', level: 'error' },
     ],
   });

   prisma.$on('query', (e) => {
     if (e.duration > 100) {
       logger.warn('Slow query detected', {
         query: e.query,
         duration: e.duration,
         params: e.params,
       });
     }
   });
   ```

2. **Add Missing Indexes:**
   Review `prisma/schema.prisma` and add indexes for:
   - Foreign keys used in WHERE clauses
   - Columns used in ORDER BY
   - Columns used in JOIN conditions

3. **Implement Query Result Caching:**
   ```bash
   npm install @nestjs/cache-manager cache-manager
   ```

   **`src/common/cache/cache.module.ts`**
   ```typescript
   import { Module } from '@nestjs/common';
   import { CacheModule } from '@nestjs/cache-manager';

   @Module({
     imports: [
       CacheModule.register({
         ttl: 300, // 5 minutes
         max: 100, // max items in cache
         isGlobal: true,
       }),
     ],
   })
   export class AppCacheModule {}
   ```

   **Usage in services:**
   ```typescript
   import { CACHE_MANAGER } from '@nestjs/cache-manager';
   import { Cache } from 'cache-manager';

   constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

   async getStats(agentId: string) {
     const cacheKey = `agent-stats:${agentId}`;
     const cached = await this.cacheManager.get(cacheKey);
     if (cached) return cached;

     const stats = await this.computeStats(agentId);
     await this.cacheManager.set(cacheKey, stats, 300);
     return stats;
   }
   ```

### 4.2 Rate Limiting & Throttling

**Objective:** Protect API from abuse and ensure fair usage.

**Current Implementation:**
- Global throttle: 120 req/min (in `src/app.module.ts`)

**Enhanced Rate Limiting:**

**`src/common/throttler/throttler.config.ts`**
```typescript
import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const throttlerConfig: ThrottlerModuleOptions = {
  throttlers: [
    {
      name: 'short',
      ttl: 1000, // 1 second
      limit: 10, // 10 requests per second
    },
    {
      name: 'medium',
      ttl: 60000, // 1 minute
      limit: 120, // 120 requests per minute
    },
    {
      name: 'long',
      ttl: 3600000, // 1 hour
      limit: 1000, // 1000 requests per hour
    },
  ],
};
```

**Per-Endpoint Throttling:**
```typescript
import { Throttle } from '@nestjs/throttler';

@Post('agents')
@Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 agents per minute
async create(@Body() dto: CreateAgentDto) {
  return this.agentsService.create(dto);
}
```

### 4.3 Background Jobs with Bull

**Objective:** Offload heavy tasks to background queue.

**Install:**
```bash
npm install @nestjs/bull bull
npm install -D @types/bull
```

**`src/common/queue/queue.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue({
      name: 'agents',
    }),
    BullModule.registerQueue({
      name: 'analytics',
    }),
  ],
})
export class QueueModule {}
```

**Use Cases:**
- Agent deployment to SkyBot (async)
- Analytics report generation
- Bulk data imports
- Email notifications

**Environment Variables:**
- `REDIS_HOST` - Redis hostname - default: `localhost`
- `REDIS_PORT` - Redis port - default: `6379`
- `REDIS_PASSWORD` - Redis password (if required)

---

## Phase 5: Security Hardening

**Duration:** 1-2 weeks  
**Priority:** P1

### 5.1 API Key Rotation

**Objective:** Implement API key rotation and management.

**Tasks:**

1. **Add API Key Model:**
   ```prisma
   model ApiKey {
     id        String   @id @default(cuid())
     accountId String
     name      String
     key       String   @unique
     lastUsed  DateTime?
     expiresAt DateTime?
     isActive  Boolean  @default(true)
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt

     account Account @relation(fields: [accountId], references: [id])

     @@index([accountId])
     @@index([key])
   }
   ```

2. **Create API Key Service:**
   ```typescript
   // src/auth/api-keys/api-keys.service.ts
   async generateApiKey(accountId: string, name: string) {
     const key = `sk_${accountId}_${randomBytes(32).toString('hex')}`;
     return this.prisma.apiKey.create({
       data: { accountId, name, key, isActive: true },
     });
   }

   async rotateApiKey(keyId: string) {
     const oldKey = await this.prisma.apiKey.findUnique({ where: { id: keyId } });
     await this.prisma.apiKey.update({
       where: { id: keyId },
       data: { isActive: false },
     });
     return this.generateApiKey(oldKey.accountId, `${oldKey.name} (rotated)`);
   }
   ```

3. **Update API Key Guard:**
   ```typescript
   // src/auth/guards/api-key.guard.ts
   async validateApiKey(key: string) {
     const apiKey = await this.prisma.apiKey.findUnique({
       where: { key, isActive: true },
     });

     if (!apiKey) return null;
     if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

     // Update last used timestamp
     await this.prisma.apiKey.update({
       where: { id: apiKey.id },
       data: { lastUsed: new Date() },
     });

     return apiKey;
   }
   ```

### 5.2 Secrets Management

**Objective:** Move secrets to environment variables and use secret managers.

**Current State:**
- All secrets in `.env` file
- No encryption at rest

**Recommended Approach:**

1. **Local Development:** Use `.env` file (gitignored)

2. **Production:** Use Render environment variables or secret managers

3. **Sensitive Data Encryption:**
   ```bash
   npm install @nestjs/config
   ```

   **`src/common/encryption/encryption.service.ts`**
   ```typescript
   import { Injectable } from '@nestjs/common';
   import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

   @Injectable()
   export class EncryptionService {
     private readonly algorithm = 'aes-256-gcm';
     private readonly key = Buffer.from(
       process.env.ENCRYPTION_KEY || '',
       'base64'
     );

     encrypt(text: string): string {
       const iv = randomBytes(16);
       const cipher = createCipheriv(this.algorithm, this.key, iv);
       const encrypted = Buffer.concat([
         cipher.update(text, 'utf8'),
         cipher.final(),
       ]);
       const authTag = cipher.getAuthTag();
       return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
     }

     decrypt(encrypted: string): string {
       const [ivHex, authTagHex, encryptedHex] = encrypted.split(':');
       const iv = Buffer.from(ivHex, 'hex');
       const authTag = Buffer.from(authTagHex, 'hex');
       const encryptedText = Buffer.from(encryptedHex, 'hex');

       const decipher = createDecipheriv(this.algorithm, this.key, iv);
       decipher.setAuthTag(authTag);
       return decipher.update(encryptedText) + decipher.final('utf8');
     }
   }
   ```

   **Generate encryption key:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

**Environment Variables:**
- `ENCRYPTION_KEY` - Base64-encoded 32-byte key for data encryption

### 5.3 Input Validation & Sanitization

**Objective:** Prevent injection attacks and validate all user inputs.

**Tasks:**

1. **Install validation dependencies:**
   ```bash
   npm install class-validator class-transformer
   ```

2. **Create strict DTOs with validation:**
   ```typescript
   import { IsString, IsEmail, IsEnum, MinLength, MaxLength, IsOptional } from 'class-validator';

   export class CreateUserDto {
     @IsString()
     @MinLength(3)
     @MaxLength(50)
     username: string;

     @IsEmail()
     email: string;

     @IsString()
     @MinLength(8)
     @MaxLength(100)
     password: string;

     @IsEnum(UserRole)
     @IsOptional()
     role?: UserRole;
   }
   ```

3. **Enable global validation pipe** (already done in `src/main.ts`):
   ```typescript
   app.useGlobalPipes(
     new ValidationPipe({
       whitelist: true, // Strip non-whitelisted properties
       forbidNonWhitelisted: true, // Throw error if non-whitelisted properties
       transform: true, // Auto-transform to DTO types
     })
   );
   ```

4. **Sanitize HTML inputs:**
   ```bash
   npm install sanitize-html
   ```

   ```typescript
   import sanitizeHtml from 'sanitize-html';

   @Transform(({ value }) => sanitizeHtml(value, { allowedTags: [] }))
   description: string;
   ```

### 5.4 CSRF Protection

**Objective:** Protect against Cross-Site Request Forgery attacks.

**Install:**
```bash
npm install csurf
npm install -D @types/csurf
```

**`src/main.ts`:**
```typescript
import * as csurf from 'csurf';

app.use(csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
}));
```

**Note:** Only enable for cookie-based authentication. For JWT, CSRF is not needed.

---

## Optional: Plugins & API Tierces Ecosystem

**Duration:** 6-8 weeks  
**Priority:** P3 (Post-MVP)

This is an extensive roadmap for building a plugin ecosystem and third-party integrations.

### Overview

Transform SkyBot-Inbox into a platform with:
- Plugin SDK for custom agent templates
- Marketplace for community-built agents
- Zapier/Make.com/n8n integrations
- Developer portal with documentation

### Week 1-2: Plugin SDK Foundation

**Objective:** Create SDK for building custom agent templates.

**Files to Create:**

**`packages/plugin-sdk/src/index.ts`**
```typescript
export interface AgentPlugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  category: 'SALES' | 'SUPPORT' | 'INTELLIGENCE' | 'FINANCE' | 'HR' | 'CUSTOM';
  
  // Plugin lifecycle hooks
  onInstall?: (context: PluginContext) => Promise<void>;
  onUninstall?: (context: PluginContext) => Promise<void>;
  onActivate?: (context: PluginContext) => Promise<void>;
  onDeactivate?: (context: PluginContext) => Promise<void>;
  
  // Agent execution
  execute: (input: AgentInput, context: PluginContext) => Promise<AgentOutput>;
  
  // Configuration schema
  configSchema: JSONSchema;
  
  // Permissions required
  permissions: Permission[];
}

export interface PluginContext {
  accountId: string;
  userId: string;
  config: Record<string, any>;
  storage: PluginStorage;
  http: HttpClient;
  logger: Logger;
}

export interface AgentInput {
  message: string;
  metadata?: Record<string, any>;
}

export interface AgentOutput {
  response: string;
  actions?: Action[];
  metadata?: Record<string, any>;
}
```

**Example Plugin:**

**`examples/lead-scorer-plugin/index.ts`**
```typescript
import { AgentPlugin, PluginContext, AgentInput, AgentOutput } from '@skybot/plugin-sdk';

export const LeadScorerPlugin: AgentPlugin = {
  id: 'lead-scorer-v1',
  name: 'Lead Scorer',
  version: '1.0.0',
  author: 'SkyBot Team',
  description: 'Scores leads based on engagement and profile data',
  category: 'SALES',
  
  configSchema: {
    type: 'object',
    properties: {
      scoringCriteria: { type: 'string', enum: ['engagement', 'profile', 'mixed'] },
      threshold: { type: 'number', minimum: 0, maximum: 100 },
    },
    required: ['scoringCriteria', 'threshold'],
  },
  
  permissions: ['read:contacts', 'write:leads', 'read:analytics'],
  
  async execute(input: AgentInput, context: PluginContext): Promise<AgentOutput> {
    const { message, metadata } = input;
    const { config, logger } = context;
    
    logger.info('Scoring lead', { message, config });
    
    // Your scoring logic here
    const score = calculateLeadScore(message, metadata, config);
    
    return {
      response: `Lead scored: ${score}/100`,
      actions: [
        {
          type: 'update_lead',
          data: { score, status: score > config.threshold ? 'qualified' : 'nurture' },
        },
      ],
      metadata: { score, threshold: config.threshold },
    };
  },
};

function calculateLeadScore(message: string, metadata: any, config: any): number {
  // Simplified scoring logic
  let score = 50;
  
  if (message.includes('enterprise')) score += 20;
  if (message.includes('urgent')) score += 15;
  if (metadata?.company_size > 100) score += 15;
  
  return Math.min(100, score);
}
```

**Tasks:**
1. Create `@skybot/plugin-sdk` package
2. Define plugin manifest schema
3. Implement plugin loader and validator
4. Create CLI for plugin development: `npx @skybot/cli create-plugin`
5. Write comprehensive SDK documentation

### Week 3-4: Plugin Marketplace

**Objective:** Build a marketplace for discovering and installing plugins.

**Database Schema:**

**`prisma/schema.prisma` additions:**
```prisma
model Plugin {
  id          String   @id @default(cuid())
  pluginId    String   @unique // Plugin's unique identifier
  name        String
  version     String
  author      String
  description String   @db.Text
  category    String
  
  // Marketplace metadata
  downloads   Int      @default(0)
  rating      Float?
  reviews     Int      @default(0)
  price       Decimal? @db.Decimal(10, 2) // null = free
  
  // Plugin package
  packageUrl  String
  checksum    String
  
  isPublished Boolean  @default(false)
  isVerified  Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  installations PluginInstallation[]
  
  @@index([category])
  @@index([isPublished])
}

model PluginInstallation {
  id        String   @id @default(cuid())
  accountId String
  pluginId  String
  config    Json?
  isActive  Boolean  @default(true)
  
  installedAt DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  account Account @relation(fields: [accountId], references: [id])
  plugin  Plugin  @relation(fields: [pluginId], references: [pluginId])
  
  @@unique([accountId, pluginId])
  @@index([accountId])
}
```

**API Endpoints:**

**`src/plugins/plugins.controller.ts`**
```typescript
@Controller('plugins')
export class PluginsController {
  // Browse marketplace
  @Get()
  async listPlugins(@Query() filters: PluginFiltersDto) {
    return this.pluginsService.findAll(filters);
  }
  
  // Get plugin details
  @Get(':pluginId')
  async getPlugin(@Param('pluginId') pluginId: string) {
    return this.pluginsService.findOne(pluginId);
  }
  
  // Install plugin
  @Post(':pluginId/install')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async installPlugin(
    @CurrentUser() user: any,
    @Param('pluginId') pluginId: string,
    @Body() config: PluginConfigDto,
  ) {
    return this.pluginsService.install(user.accountId, pluginId, config);
  }
  
  // Uninstall plugin
  @Delete(':pluginId/uninstall')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.SUPER_ADMIN)
  async uninstallPlugin(
    @CurrentUser() user: any,
    @Param('pluginId') pluginId: string,
  ) {
    return this.pluginsService.uninstall(user.accountId, pluginId);
  }
  
  // List installed plugins
  @Get('installed')
  async listInstalledPlugins(@CurrentUser() user: any) {
    return this.pluginsService.findInstalled(user.accountId);
  }
}
```

**Frontend:**
- Plugin marketplace UI (browse, search, filter)
- Plugin details page (description, reviews, install button)
- Installed plugins management page

### Week 5-6: Third-Party Integrations

**Objective:** Integrate with Zapier, Make.com, and n8n.

#### Zapier Integration

**Files to Create:**

**`src/integrations/zapier/zapier.controller.ts`**
```typescript
@Controller('integrations/zapier')
@Public()
export class ZapierController {
  // Zapier authentication
  @Post('auth/test')
  async testAuth(@Headers('x-api-key') apiKey: string) {
    const account = await this.authService.validateApiKey(apiKey);
    if (!account) throw new UnauthorizedException();
    return { accountId: account.id, name: account.name };
  }
  
  // Triggers: "New Lead Created"
  @Get('triggers/new-lead')
  async newLeadTrigger(@Query('api_key') apiKey: string) {
    const account = await this.authService.validateApiKey(apiKey);
    const leads = await this.crmService.getRecentLeads(account.id, { limit: 100 });
    return leads;
  }
  
  // Triggers: "Agent Execution Completed"
  @Get('triggers/agent-executed')
  async agentExecutedTrigger(@Query('api_key') apiKey: string) {
    const account = await this.authService.validateApiKey(apiKey);
    const executions = await this.agentsService.getRecentExecutions(account.id, { limit: 100 });
    return executions;
  }
  
  // Actions: "Create Lead"
  @Post('actions/create-lead')
  async createLeadAction(@Body() data: ZapierCreateLeadDto) {
    const account = await this.authService.validateApiKey(data.api_key);
    return this.crmService.createLead(account.id, data);
  }
  
  // Actions: "Send Message"
  @Post('actions/send-message')
  async sendMessageAction(@Body() data: ZapierSendMessageDto) {
    const account = await this.authService.validateApiKey(data.api_key);
    return this.messagesService.send(account.id, data);
  }
}
```

**Zapier App Definition:**
Create `zapier/package.json`:
```json
{
  "name": "skybot-inbox",
  "version": "1.0.0",
  "description": "Integrate SkyBot-Inbox with 5000+ apps",
  "main": "index.js"
}
```

**Submit to Zapier:**
1. Create Zapier developer account
2. Define triggers and actions
3. Test integration
4. Submit for review

#### Make.com Integration

Similar approach to Zapier. Make.com uses OpenAPI spec:

**`docs/openapi.yaml`**
Generate OpenAPI spec from NestJS:
```bash
npm install @nestjs/swagger
```

**`src/main.ts`:**
```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('SkyBot-Inbox API')
  .setDescription('API for SkyBot-Inbox platform')
  .setVersion('1.0')
  .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' })
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api-docs', app, document);
```

Upload OpenAPI spec to Make.com.

#### n8n Integration

**Create n8n Node:**

**`packages/n8n-nodes-skybot/nodes/SkyBotInbox/SkyBotInbox.node.ts`**
```typescript
import { INodeType, INodeTypeDescription } from 'n8n-workflow';

export class SkyBotInbox implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'SkyBot Inbox',
    name: 'skybotInbox',
    group: ['transform'],
    version: 1,
    description: 'Interact with SkyBot Inbox API',
    defaults: {
      name: 'SkyBot Inbox',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'skybotInboxApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        options: [
          { name: 'Lead', value: 'lead' },
          { name: 'Agent', value: 'agent' },
          { name: 'Message', value: 'message' },
        ],
        default: 'lead',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          { name: 'Create', value: 'create' },
          { name: 'Get', value: 'get' },
          { name: 'Update', value: 'update' },
        ],
        default: 'create',
      },
      // ... more properties
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Implementation
  }
}
```

Publish to n8n community nodes.

### Week 7-8: Developer Portal

**Objective:** Create developer documentation and portal.

**Structure:**

```
docs/
├── getting-started.md
├── authentication.md
├── api-reference/
│   ├── agents.md
│   ├── leads.md
│   ├── messages.md
├── plugin-development/
│   ├── quickstart.md
│   ├── plugin-structure.md
│   ├── sdk-reference.md
│   ├── testing.md
│   ├── publishing.md
├── webhooks.md
├── rate-limits.md
└── changelog.md
```

**Tools:**
- Use Docusaurus or GitBook for documentation site
- Host at `https://developers.skybot.com`
- Include interactive API playground (Swagger UI)

**Developer Portal Features:**
- API key management
- Usage analytics
- Webhook logs
- Sample code in multiple languages (curl, Node.js, Python)

---

## Implementation Priority

### Immediate (Next 2 weeks)
1. ✅ Phase 1: DevOps Core - **DONE**
2. ✅ Phase 2: RBAC & Admin - **DONE**
3. ✅ Phase 2B: SkyBot Integration - **DONE**
4. 🔲 Phase 3: Monitoring (Winston, Sentry)
5. 🔲 Phase 5.3: Input Validation (enhance existing DTOs)

### Short-term (Next month)
1. 🔲 Phase 4.1: Database optimization
2. 🔲 Phase 4.2: Enhanced rate limiting
3. 🔲 Phase 5.1: API key rotation
4. 🔲 Phase 5.2: Secrets management

### Medium-term (2-3 months)
1. 🔲 Phase 4.3: Background jobs (Bull + Redis)
2. 🔲 Plugin SDK foundation (if pursuing ecosystem)
3. 🔲 Zapier/Make.com integration (if pursuing ecosystem)

### Long-term (3-6 months)
1. 🔲 Plugin Marketplace (if pursuing ecosystem)
2. 🔲 Developer Portal (if pursuing ecosystem)
3. 🔲 n8n community node (if pursuing ecosystem)

---

## Environment Variables Reference

### Core Application
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Application port (default: `3000`)
- `NODE_ENV` - Environment (development/production)
- `API_KEY` - Legacy API key for backwards compatibility

### Authentication & Security
- `JWT_SECRET` - Secret for JWT signing (min 32 chars)
- `JWT_ACCESS_EXPIRY` - Access token expiry (default: `15m`)
- `JWT_REFRESH_EXPIRY` - Refresh token expiry (default: `7d`)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_CALLBACK_URL` - Google OAuth callback URL
- `MAGIC_LINK_SECRET` - Secret for magic link tokens
- `ENCRYPTION_KEY` - Base64-encoded 32-byte key for data encryption

### SkyBot Integration
- `SKYBOT_API_URL` - SkyBot API base URL (default: `http://localhost:8080`)
- `SKYBOT_API_KEY` - API key for SkyBot authentication
- `SKYBOT_WEBHOOK_SECRET` - Secret for incoming SkyBot webhooks

### N8N Integration
- `N8N_MASTER_ROUTER_URL` - N8N webhook endpoint
- `N8N_MASTER_ROUTER_NAME` - N8N router name (for logging)
- `N8N_MASTER_ROUTER_SECRET` - Shared secret for N8N authentication

### WhatsApp
- `WHATSAPP_APP_SECRET` - Meta app secret for webhook verification
- `WHATSAPP_VERIFY_TOKEN` - Token for webhook verification

### Airtable
- `AIRTABLE_API_KEY` - Airtable API key
- `AIRTABLE_BASE_ID` - Airtable base ID

### Billing
- `BILLING_PORTAL_URL` - Billing portal URL (default: `https://billing.skybot.com`)
- `BILLING_SSO_SECRET` - Secret for billing SSO tokens

### Monitoring & Observability (Phase 3)
- `LOG_LEVEL` - Log level (debug/info/warn/error) (default: `info`)
- `SENTRY_DSN` - Sentry DSN for error tracking
- `SENTRY_TRACES_SAMPLE_RATE` - Sentry trace sample rate (0.0-1.0) (default: `0.1`)
- `SENTRY_PROFILES_SAMPLE_RATE` - Sentry profile sample rate (0.0-1.0) (default: `0.1`)

### Redis (Phase 4 - Background Jobs)
- `REDIS_HOST` - Redis hostname (default: `localhost`)
- `REDIS_PORT` - Redis port (default: `6379`)
- `REDIS_PASSWORD` - Redis password (if required)

---

## Testing Strategy

### Unit Tests
- All services and controllers
- Aim for 60%+ coverage
- Run with: `npm run test`

### Integration Tests
- Database operations
- External API integrations
- Run with: `npm run test:integration`

### E2E Tests
- Complete user flows
- API endpoint testing
- Already implemented: `test/agents.e2e-spec.ts`
- Run with: `npm run test:e2e`

### Load Tests
- Use k6 or Artillery
- Test endpoints under load
- Identify performance bottlenecks

---

## Deployment Checklist

### Before Deploying to Production

- [ ] All environment variables configured in Render
- [ ] Database backups scheduled (daily)
- [ ] Sentry error tracking enabled
- [ ] Health checks configured (`/api/health`, `/api/ready`)
- [ ] Rate limiting enabled
- [ ] CORS configured for production domain
- [ ] SSL/TLS certificates configured
- [ ] Database indexes optimized
- [ ] Logging configured (Winston with JSON output)
- [ ] Security headers enabled (Helmet)
- [ ] API documentation published
- [ ] Secrets rotated and secured
- [ ] Monitoring dashboards created
- [ ] On-call rotation established

---

## Support & Maintenance

### Monitoring
- Check Sentry daily for errors
- Review logs for anomalies
- Monitor API response times
- Track database query performance

### Updates
- Update dependencies monthly
- Review security advisories weekly
- Test updates in staging first
- Keep Prisma schema in sync

### Backups
- Automated daily database backups
- Test restore process quarterly
- Keep backups for 30 days minimum
- Store backups in separate region

---

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Sentry for Node.js](https://docs.sentry.io/platforms/node/)
- [Bull Queue](https://github.com/OptimalBits/bull)
- [Zapier Platform](https://platform.zapier.com/)
- [n8n Community Nodes](https://docs.n8n.io/integrations/creating-nodes/)

---

**Last Updated:** 2026-01-26  
**Next Review:** 2026-02-26

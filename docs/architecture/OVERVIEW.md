# Architecture Overview

SkyBot Inbox is built on a modern, scalable, and maintainable architecture designed for enterprise multi-tenancy.

---

## High-Level Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└────────┬────────┘
         │ HTTPS/WSS
         ▼
┌─────────────────────────────────────────────────────┐
│              API Gateway / Load Balancer            │
└───────────────────┬─────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│   Backend API   │   │   WebSocket     │
│   (NestJS)      │   │   Server        │
└────────┬────────┘   └────────┬────────┘
         │                     │
         └──────────┬──────────┘
                    │
         ┌──────────┴──────────────────────┐
         │                                  │
         ▼                                  ▼
┌─────────────────┐              ┌──────────────────┐
│   PostgreSQL    │              │   External APIs  │
│   (Prisma ORM)  │              │   - WhatsApp     │
└─────────────────┘              │   - Meta Graph   │
                                 │   - N8N          │
                                 │   - Airtable     │
                                 │   - Stripe       │
                                 └──────────────────┘
```

---

## Core Principles

### 1. Multi-Tenancy by Design

Every entity in the system is scoped to an `accountId`:

```typescript
// All major entities have accountId
model Conversation {
  id          String   @id @default(cuid())
  accountId   String   // Tenant isolation
  // ...
}
```

**Benefits:**
- Complete data isolation between accounts
- Scalable to thousands of tenants
- Simplified billing and access control

### 2. Modular Architecture

37 independent modules, each with clear responsibilities:

```
src/
├── accounts/        # Multi-tenant account management
├── auth/            # Authentication & authorization
├── channels/        # Multi-channel messaging framework
├── conversations/   # Conversation orchestration
├── messages/        # Message handling
├── webhooks/        # External webhook ingestion
├── crm/             # Lead & feedback management
├── analytics/       # Real-time analytics
└── ...              # 29 more modules
```

Each module follows NestJS best practices:
- **Controller**: HTTP/WebSocket endpoints
- **Service**: Business logic
- **Module**: Dependency injection
- **DTOs**: Input validation
- **Tests**: Unit & E2E coverage

### 3. Unified Messaging Interface

All channels (WhatsApp, Instagram, Facebook, Email, Web) are normalized to a common `UnifiedMessage` interface:

```typescript
interface UnifiedMessage {
  externalId: string;
  channelType: ChannelType;
  direction: 'INBOUND' | 'OUTBOUND';
  from: string;
  to: string;
  text?: string;
  attachments?: MessageAttachment[];
  timestamp: Date;
  metadata: Record<string, any>;
}
```

**Benefits:**
- Channel-agnostic business logic
- Easy to add new channels
- Consistent message routing to N8N

### 4. Event-Driven Communication

- **REST API**: Synchronous operations (CRUD)
- **WebSockets**: Real-time updates (new messages, status changes)
- **Webhooks**: External event ingestion (WhatsApp, Meta, N8N)

```
Webhook → Normalized → Stored → WebSocket → Frontend
   ↓
  N8N (async workflows)
```

### 5. Security Layers

Multiple layers of security:

1. **Network**: HTTPS only, CORS, rate limiting
2. **Authentication**: JWT access + refresh tokens
3. **Authorization**: RBAC (ADMIN, USER, AGENT_USER)
4. **Data**: AES-256-GCM encryption for sensitive tokens
5. **Audit**: All critical actions logged to `AuditLog`

---

## Technology Stack

### Backend Core

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | NestJS 11.x | Scalable TypeScript framework |
| **Language** | TypeScript 5.7 | Type safety & modern JS |
| **Database** | PostgreSQL 15+ | ACID-compliant relational DB |
| **ORM** | Prisma 6.x | Type-safe database client |
| **Auth** | Passport + JWT | Authentication & authorization |
| **Validation** | class-validator | DTO validation |
| **Real-time** | Socket.io | WebSocket communication |
| **Logging** | Winston | Structured logging |
| **Security** | Helmet.js | HTTP security headers |

### External Integrations

| Service | Purpose | API |
|---------|---------|-----|
| **WhatsApp** | Messaging | Meta Graph API v21.0 |
| **Instagram** | DM messaging | Meta Graph API |
| **Facebook** | Messenger | Meta Graph API |
| **N8N** | Workflow automation | REST + Webhooks |
| **Airtable** | CRM data storage | REST API |
| **Stripe** | Billing | REST + Webhooks |
| **Render.com** | Hosting & DB | Platform |

---

## Data Flow

### Inbound Message Flow

```
1. WhatsApp User sends message
   ↓
2. Meta Webhooks → POST /webhooks/meta
   ↓
3. WebhooksService validates HMAC signature
   ↓
4. MetaConnector.ingestWebhook() normalizes to UnifiedMessage
   ↓
5. MessagesService saves to database
   ↓
6. N8N Master Router receives message for AI processing
   ↓
7. WebSocket emits 'new_message' to frontend
   ↓
8. Frontend displays message in real-time
```

### Outbound Message Flow

```
1. User types message in frontend
   ↓
2. WebSocket emit 'send_message'
   ↓
3. MessagesService.send() validates & saves
   ↓
4. ChannelsService routes to appropriate connector
   ↓
5. MetaConnector.sendMessage() calls Graph API
   ↓
6. Message delivered via WhatsApp/Instagram/Facebook
   ↓
7. Database updated with external message ID
   ↓
8. Frontend receives confirmation
```

---

## Database Architecture

### Schema Highlights

```prisma
model Account {
  id          String @id @default(cuid())
  name        String
  isDemo      Boolean @default(false)
  features    Json    // Feature flags per account
  users       UserAccount[]
  conversations Conversation[]
  // ... all tenant data
}

model UserAccount {
  id          String @id @default(cuid())
  accountId   String
  email       String @unique
  role        UserRole  // ADMIN | USER | AGENT_USER
  status      UserStatus
  account     Account @relation(...)
}

model Conversation {
  id          String @id @default(cuid())
  accountId   String
  contactId   String
  inboxId     String?
  status      ConversationStatus
  messages    Message[]
  // ... metadata
}

model Message {
  id              String @id @default(cuid())
  conversationId  String
  externalId      String? // ID from WhatsApp/IG/FB
  direction       MessageDirection
  text            String?
  attachments     Json?
  conversation    Conversation @relation(...)
}

model ChannelConnection {
  id                String @id @default(cuid())
  accountId         String
  channelType       ChannelType
  channelIdentifier String  // Phone number, Page ID, etc.
  encryptedToken    String  // AES-256-GCM encrypted
  iv                String  // Encryption IV
  authTag           String  // Encryption auth tag
  status            ConnectionStatus
  metadata          Json
}
```

### Indexes

All queries are optimized with strategic indexes:

```prisma
@@index([accountId])
@@index([accountId, status])
@@index([accountId, createdAt])
@@unique([accountId, email])
```

---

## Scalability Considerations

### Current Architecture (Monolith)

- **Single Backend Service**: NestJS handles all modules
- **Single Database**: PostgreSQL with connection pooling
- **WebSocket**: In-memory (single instance)

**Pros:**
- Simple deployment
- Easy to develop and debug
- Low operational overhead

**Cons:**
- Horizontal scaling requires sticky sessions (WebSockets)
- Database becomes bottleneck at high scale

### Future Scaling Path (if needed)

1. **Redis for WebSockets**: Shared state across instances
2. **Read Replicas**: Offload analytics queries
3. **Message Queue**: Async processing (RabbitMQ/SQS)
4. **Microservices**: Split channels, analytics, webhooks

---

## Security Architecture

### Authentication Flow

```
1. User submits email + password
   ↓
2. AuthService validates credentials (bcrypt)
   ↓
3. Generate JWT access token (15 min expiry)
   ↓
4. Generate JWT refresh token (7 day expiry)
   ↓
5. Return both tokens + user info
   ↓
6. Client stores tokens (localStorage/httpOnly cookie)
   ↓
7. Client includes access token in Authorization header
   ↓
8. JwtAuthGuard validates token on each request
   ↓
9. When access expires, use refresh token to get new access
```

### Authorization (RBAC)

```typescript
// Roles hierarchy
ADMIN > USER > AGENT_USER

// Usage in controllers
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
async adminOnlyEndpoint() { ... }
```

### Webhook Security

- **HMAC Validation**: All Meta webhooks verified with SHA256 signature
- **Verify Token**: Meta webhook subscriptions use secret token
- **N8N Auth**: Shared secret header for N8N webhooks

### Data Encryption

- **Tokens**: AES-256-GCM encryption for OAuth tokens
- **Passwords**: bcrypt (10 rounds)
- **Secrets**: Environment variables, never committed

---

## Deployment Architecture

### Production (Render.com)

```
┌─────────────────────────────────────┐
│   Render.com Platform               │
│                                     │
│  ┌──────────────┐  ┌──────────────┐│
│  │ Web Service  │  │ PostgreSQL   ││
│  │ (Backend)    │  │ (Managed DB) ││
│  │              │  │              ││
│  │ Auto-deploy  │  │ Auto-backup  ││
│  │ on git push  │  │              ││
│  └──────────────┘  └──────────────┘│
└─────────────────────────────────────┘
```

**Features:**
- **Auto Deployment**: Git push to `main` triggers deploy
- **Zero Downtime**: Rolling deploys
- **Auto Scaling**: Horizontal pod autoscaling
- **Managed Database**: Automatic backups, high availability
- **SSL/TLS**: Automatic HTTPS
- **Environment Variables**: Secure secret management

---

## Module Interaction Diagram

```
┌──────────┐
│   Auth   │──────┐
└──────────┘      │
                  ▼
┌──────────┐  ┌──────────────┐
│ Accounts │◄─┤ ALL MODULES  │
└──────────┘  └──────────────┘
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│Channels  │ │  CRM     │ │Analytics │
└────┬─────┘ └──────────┘ └──────────┘
     │
     ▼
┌──────────────┐
│ Messages     │◄──┐
│ Conversations│   │
└──────┬───────┘   │
       │           │
       └───────────┘
```

---

## Performance Metrics

### Response Times (Target)

- **API Endpoints**: < 200ms (p95)
- **Webhook Ingestion**: < 100ms (p95)
- **WebSocket Events**: < 50ms (p95)
- **Database Queries**: < 50ms (p95)

### Throughput (Design Capacity)

- **Messages/second**: 100+ inbound
- **Concurrent Users**: 1,000+
- **Active Accounts**: 100+
- **Database Connections**: 100 (pooled)

---

## Monitoring & Observability

### Logging

- **Winston**: Structured JSON logs
- **Log Levels**: error, warn, info, debug
- **Context**: Request ID, user ID, account ID on all logs

### Health Checks

- `GET /health`: Liveness probe
- `GET /ready`: Readiness probe (DB check)

### Audit Trail

All critical actions logged to `AuditLog`:
- User login/logout
- Account creation/modification
- User creation/deletion
- Permission changes

---

## Next Steps

- **Module Documentation**: See [Module Index](../modules/INDEX.md)
- **Database Schema**: See [Database Documentation](./DATABASE.md)
- **API Reference**: See [REST API](../api/REST_API.md)
- **Deployment**: See [Deployment Guide](../deployment/RENDER.md)

---

**Last Updated**: 2026-01-30

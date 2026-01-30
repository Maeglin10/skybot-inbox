# Modules Index

SkyBot Inbox consists of 37 specialized modules, each handling specific functionality. This index provides an overview of all modules and their responsibilities.

---

## Core Modules

### Authentication & Authorization

#### `auth/`
**Purpose**: User authentication, JWT tokens, session management
**Key Features**:
- Email/password authentication
- JWT access & refresh tokens
- Magic link authentication
- Google OAuth integration
- Password reset flow

**Main Files**:
- `auth.service.ts` - Authentication logic
- `auth.controller.ts` - Auth endpoints
- `strategies/jwt.strategy.ts` - JWT validation
- `strategies/google.strategy.ts` - Google OAuth
- `guards/jwt-auth.guard.ts` - Route protection

**API Endpoints**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/magic-link` - Request magic link
- `GET /api/auth/google` - Start Google OAuth
- `GET /api/auth/me` - Get current user

---

### Account Management

#### `accounts/`
**Purpose**: Multi-tenant account management
**Key Features**:
- Account CRUD operations
- Feature flag management
- Account settings
- Usage tracking

**Main Files**:
- `accounts.service.ts` - Account business logic
- `accounts.controller.ts` - Account API endpoints
- `dto/create-account.dto.ts` - Account creation validation

**API Endpoints**:
- `GET /api/accounts` - List accounts
- `GET /api/accounts/:id` - Get account details
- `POST /api/accounts` - Create account
- `PATCH /api/accounts/:id` - Update account
- `PATCH /api/accounts/:id/features` - Update feature flags

---

#### `users/`
**Purpose**: User management within accounts
**Key Features**:
- User CRUD operations
- Role assignment (ADMIN, USER, AGENT_USER)
- User preferences
- Status management

---

#### `admin/`
**Purpose**: Admin-only operations
**Key Features**:
- Create/manage users within account
- Prevent deletion of last admin
- Password management
- Audit trail

**Authorization**: Requires `UserRole.ADMIN`

---

## Communication Modules

### Multi-Channel Framework

#### `channels/`
**Purpose**: Unified multi-channel messaging framework
**Key Features**:
- Channel connector abstraction
- OAuth flow management
- Token encryption (AES-256-GCM)
- Connection status monitoring
- Send/receive message routing

**Connectors**:
- `connectors/meta.connector.ts` - Instagram + Facebook Messenger
- Future: WhatsApp, Email, Webchat

**Main Interfaces**:
- `ChannelConnector` - Base connector interface
- `UnifiedMessage` - Normalized message format
- `ConnectionStatus` - Health monitoring

**API Endpoints**:
- `POST /api/channels/:type/connect` - Start OAuth flow
- `GET /api/channels/:type/callback` - OAuth callback
- `GET /api/channels` - List connections
- `GET /api/channels/:id/status` - Connection health
- `DELETE /api/channels/:id` - Disconnect channel
- `POST /api/channels/:id/send` - Send message

---

#### `whatsapp/`
**Purpose**: WhatsApp-specific functionality
**Key Features**:
- WhatsApp Cloud API integration
- Message templates
- Media handling
- Phone number management

---

#### `webhooks/`
**Purpose**: External webhook ingestion
**Key Features**:
- Meta webhook verification & ingestion
- HMAC signature validation
- Webhook routing to services
- Error handling & retries

**Endpoints**:
- `GET /webhooks/meta` - Webhook verification
- `POST /webhooks/meta` - Receive IG + FB messages
- `POST /webhooks/whatsapp` - Receive WhatsApp messages
- `POST /webhooks/n8n` - Receive N8N callbacks

---

### Conversations & Messages

#### `conversations/`
**Purpose**: Conversation lifecycle management
**Key Features**:
- Create/close conversations
- Status tracking (OPEN, CLOSED, PENDING)
- Assignment to agents
- Conversation search & filtering

**API Endpoints**:
- `GET /api/conversations` - List conversations
- `GET /api/conversations/:id` - Get conversation details
- `POST /api/conversations` - Create conversation
- `PATCH /api/conversations/:id/status` - Update status
- `PATCH /api/conversations/:id/assign` - Assign agent

---

#### `messages/`
**Purpose**: Message handling and storage
**Key Features**:
- Send/receive messages
- Message attachments
- Message search
- Read receipts

**API Endpoints**:
- `GET /api/messages` - List messages
- `GET /api/conversations/:id/messages` - Conversation messages
- `POST /api/messages` - Send message
- `PATCH /api/messages/:id/read` - Mark as read

---

#### `contacts/`
**Purpose**: Contact management
**Key Features**:
- Contact CRUD operations
- Corporate contact flagging
- Contact search
- Contact metadata

---

#### `inboxes/`
**Purpose**: Inbox configuration (WhatsApp phone numbers, etc.)
**Key Features**:
- Inbox creation & configuration
- Channel assignment
- Status monitoring

---

## CRM & Business Intelligence

#### `crm/`
**Purpose**: Lead and feedback management
**Key Features**:
- Lead tracking (temperature, status, source)
- Feedback collection
- Lead assignment
- CRM analytics

**API Endpoints**:
- `GET/POST/PATCH/DELETE /api/crm/leads`
- `GET/POST/PATCH/DELETE /api/crm/feedbacks`

---

#### `analytics/`
**Purpose**: Real-time analytics and KPIs
**Key Features**:
- KPI calculations (response time, resolution rate)
- Time-series charts
- Breakdown by channel, agent, status
- Export to CSV

**API Endpoints**:
- `GET /api/analytics/kpis` - Dashboard KPIs
- `GET /api/analytics/chart` - Time-series data
- `GET /api/analytics/breakdown` - Drill-down analytics

---

#### `alerts/`
**Purpose**: Alert management system
**Key Features**:
- Transaction alerts
- Corporate contact alerts
- System alerts
- Alert assignment & resolution

**Types**:
- `TRANSACTION` - Sales/payment alerts
- `CONVERSATION` - Message alerts
- `CORPORATE_CONTACT` - VIP contact alerts
- `SYSTEM` - System notifications

---

#### `competitive-analysis/`
**Purpose**: SEO and competitor analysis
**Key Features**:
- Website SEO analysis
- Competitor discovery
- AI-powered recommendations
- Market insights

---

## Automation & Integration

#### `agents/`
**Purpose**: N8N workflow deployment
**Key Features**:
- Deploy workflows from templates
- Activate/deactivate agents
- Agent configuration
- SkyBot API integration

**API Endpoints**:
- `GET /api/agents` - List deployed agents
- `POST /api/agents` - Deploy agent from template
- `PATCH /api/agents/:id/activate` - Activate agent
- `POST /api/agents/:id/trigger` - Manual trigger

---

#### `templates/`
**Purpose**: Agent template management
**Key Features**:
- 50+ pre-built N8N templates
- Template categories (sales, support, intelligence)
- Template configuration
- Version control

---

#### `stories/`
**Purpose**: WhatsApp Stories automation
**Key Features**:
- Schedule stories
- Media upload
- Story analytics

---

#### `integrations/`
**Purpose**: Third-party integrations
**Key Features**:
- Integration management
- OAuth flow handling
- Webhook subscriptions

---

#### `airtable/`
**Purpose**: Airtable CRM integration
**Key Features**:
- Sync leads to Airtable
- Sync feedbacks
- Sync analytics
- Bidirectional sync

---

#### `shopify/`
**Purpose**: Shopify e-commerce integration
**Key Features**:
- Product catalog sync
- Order notifications
- Abandoned cart recovery

---

## Configuration & Settings

#### `settings/`
**Purpose**: Account-wide settings
**Key Features**:
- General settings
- Notification preferences
- Integration settings
- Feature toggles

---

#### `preferences/`
**Purpose**: User-specific preferences
**Key Features**:
- UI preferences
- Language selection
- Notification settings

---

#### `user-preferences/`
**Purpose**: Per-user configuration
**Key Features**:
- Theme (light/dark)
- Timezone
- Default view

---

#### `knowledge/`
**Purpose**: Knowledge base management
**Key Features**:
- Article management
- FAQ categories
- Search functionality

---

#### `legal/`
**Purpose**: Legal documents
**Key Features**:
- Terms of service
- Privacy policy
- GDPR compliance

---

## Media & Content

#### `media/`
**Purpose**: File upload and management
**Key Features**:
- Image/video upload
- File storage (S3/local)
- Media compression
- URL generation

---

#### `corporate-numbers/`
**Purpose**: Corporate contact phone management
**Key Features**:
- Mark numbers as corporate
- Corporate contact routing
- VIP handling

---

## Utility Modules

#### `billing/`
**Purpose**: Subscription and billing
**Key Features**:
- Stripe integration
- SSO portal access (5-min JWT)
- Subscription management

**API Endpoints**:
- `GET /api/billing/portal` - Redirect to billing portal with SSO

---

#### `jobs/`
**Purpose**: Background job processing
**Key Features**:
- Scheduled tasks
- Async operations
- Job queue management

---

#### `debug/`
**Purpose**: Development debugging tools
**Key Features**:
- Request logging
- Error tracking
- Performance profiling

---

#### `ingestion/`
**Purpose**: Bulk data import
**Key Features**:
- CSV import
- Data validation
- Batch processing

---

#### `tenant-modules/`
**Purpose**: Module-level multi-tenancy configuration
**Key Features**:
- Enable/disable modules per account
- Feature gating
- Usage limits

---

## Shared Infrastructure

#### `common/`
**Purpose**: Shared utilities and infrastructure

**Submodules**:
- `audit/` - Audit logging service
- `cache/` - Redis cache module
- `encryption/` - AES-256-GCM encryption service
- `logger/` - Winston logging configuration
- `middleware/` - Request ID, tenant context
- `rate-limit/` - Rate limiting decorators
- `validators/` - Custom validation pipes

---

#### `prisma/`
**Purpose**: Database access layer
**Key Features**:
- Prisma client singleton
- Connection pooling
- Transaction management

---

#### `websockets/`
**Purpose**: Real-time WebSocket communication
**Key Features**:
- Socket.io integration
- Room management (per account)
- Event broadcasting
- Authentication

**Events**:
- `new_message` - New message received
- `conversation_updated` - Conversation status changed
- `typing` - User typing indicator

---

#### `clients/`
**Purpose**: External API clients
**Key Features**:
- HTTP client configuration
- Error handling
- Retry logic

---

## Module Dependencies

```
┌─────────────┐
│   Auth      │──┐
└─────────────┘  │
                 ▼
┌─────────────────────────────┐
│   All Business Modules      │
│   (require authentication)  │
└──────────┬──────────────────┘
           │
           ├──► Accounts (tenant isolation)
           ├──► Prisma (database access)
           ├──► Common (utilities)
           └──► WebSockets (real-time)
```

---

## Module Statistics

- **Total Modules**: 37
- **Core Modules**: 5 (auth, accounts, users, admin, prisma)
- **Communication**: 7 (channels, whatsapp, webhooks, conversations, messages, contacts, inboxes)
- **CRM & BI**: 4 (crm, analytics, alerts, competitive-analysis)
- **Automation**: 7 (agents, templates, stories, integrations, airtable, shopify, jobs)
- **Configuration**: 5 (settings, preferences, knowledge, legal, tenant-modules)
- **Infrastructure**: 9 (common, websockets, billing, media, debug, ingestion, clients, corporate-numbers)

---

## Next Steps

For detailed documentation on specific modules:
- [Authentication Module](./AUTH.md)
- [Channels Module](./CHANNELS.md)
- [CRM Module](./CRM.md)
- [Analytics Module](./ANALYTICS.md)
- [N8N Integration](./N8N_INTEGRATION.md)

---

**Last Updated**: 2026-01-30

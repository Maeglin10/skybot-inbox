# SkyBot Inbox - Multi-Tenant Messaging Platform

## Vue d'ensemble

SkyBot Inbox est une plateforme de gestion de conversations multi-canal (WhatsApp, etc.) qui s'intègre avec les agents n8n de SkyBot pour fournir une solution complète d'automatisation du service client.

**Architecture** : NestJS 11 (Backend) + Next.js 16 (Frontend) + PostgreSQL 16 + Prisma ORM

## Stack Technique

### Backend (NestJS)
- **Framework** : NestJS 11.0.1
- **Language** : TypeScript 5.7.2
- **Database** : PostgreSQL 16 via Prisma 6.2.1
- **Authentication** : Passport + JWT (à implémenter)
- **Validation** : class-validator + class-transformer
- **Rate Limiting** : @nestjs/throttler (120 req/60s)

### Frontend (Next.js)
- **Framework** : Next.js 16.0.1
- **UI** : React 19 + Tailwind CSS
- **Icons** : Lucide React
- **State** : React Hooks + Context API
- **HTTP** : Fetch API

## Architecture

### Multi-Tenant Model

```
Account (Entreprise)
  ├── ClientConfig (Configuration n8n + agents autorisés)
  ├── ExternalAccount (WhatsApp Business, etc.)
  ├── Inbox (Boîtes de réception)
  │     ├── Conversation
  │     │     ├── Message (IN/OUT)
  │     │     └── Contact
  │     └── RoutingLog (Historique routing vers agents n8n)
  └── Contacts (Clients finaux)
```

### Flux de Messages

```
WhatsApp → Webhook → WebhooksController → MessagesService → AgentsService → n8n Agent → Response → WhatsApp
                                                                                            ↓
                                                                                     RoutingLog (Airtable)
```

## Prisma Schema

### Modèles Principaux

#### Account
```prisma
model Account {
  id         String   @id @default(cuid())
  name       String
  clientKey  String?  @unique
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  clientConfigs    ClientConfig[]
  externalAccounts ExternalAccount[]
  inboxes          Inbox[]
  contacts         Contact[]
}
```

#### ClientConfig
```prisma
model ClientConfig {
  id              String       @id @default(cuid())
  accountId       String
  clientKey       String       @unique
  defaultAgentKey String       @default("master-router")
  allowedAgents   Json         // ["master-router", "crm", "setter", ...]
  channels        Json         // { whatsapp: { enabled: true, phoneNumberId: "..." } }
  status          ClientStatus @default(ACTIVE)

  account Account @relation(fields: [accountId], references: [id])
}
```

#### Conversation & Message
```prisma
model Conversation {
  id             String              @id @default(cuid())
  inboxId        String
  contactId      String
  channel        Channel             @default(WHATSAPP)
  status         ConversationStatus  @default(OPEN)
  lastActivityAt DateTime            @default(now())

  inbox    Inbox     @relation(fields: [inboxId], references: [id])
  contact  Contact   @relation(fields: [contactId], references: [id])
  messages Message[]
}

model Message {
  id             String           @id @default(cuid())
  conversationId String
  direction      MessageDirection // IN or OUT
  text           String?
  metadata       Json?            // Pièces jointes, etc.
  timestamp      DateTime         @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id])
}
```

## API Endpoints

### Webhooks

#### POST `/webhooks/whatsapp`
Reçoit les messages WhatsApp depuis Meta.

**Payload** (simplifié) :
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "33612345678",
          "text": { "body": "Bonjour" }
        }]
      }
    }]
  }]
}
```

**Response** : 200 OK

**Actions** :
1. Valide la signature HMAC
2. Parse le message
3. Trouve/crée le Contact
4. Trouve/crée la Conversation
5. Crée le Message IN
6. Appelle AgentsService.trigger()
7. Crée le Message OUT (si réponse)

#### GET `/webhooks/whatsapp`
Vérification du webhook (Meta).

**Query** : `?hub.mode=subscribe&hub.verify_token=XXX&hub.challenge=YYY`

**Response** : Retourne `hub.challenge` si `verify_token` valide.

### Agents

#### POST `/api/agents/trigger`
Déclenche un agent n8n manuellement.

**Body** :
```json
{
  "conversationId": "clx123...",
  "agentKey": "crm",
  "inputText": "Je veux changer mon email",
  "messageId": "clx456..." // Optionnel
}
```

**Response** :
```json
{
  "success": true,
  "agentKey": "crm",
  "response": "Quel est votre nouvel email?",
  "messageId": "clx789...",
  "routingLogId": "rec123..."
}
```

**Logique** :
1. Valide que la conversation existe
2. Trouve le ClientConfig pour récupérer `clientKey`
3. Vérifie que `agentKey` est dans `allowedAgents`
4. Fait un POST vers `N8N_MASTER_ROUTER_URL`
5. Parse la réponse (formats : `replyText`, `output.message`, `output.answer`)
6. Anti-spam : déduplique si dernier message OUT identique (< 10s)
7. Crée le Message OUT
8. Crée le RoutingLog

### Conversations

#### GET `/api/conversations`
Liste les conversations (avec pagination cursor).

**Query** :
- `inboxId` (requis)
- `status` : OPEN | CLOSED | ALL (défaut: OPEN)
- `limit` : 20 (défaut)
- `cursor` : ID de la dernière conversation (pagination)

**Response** :
```json
{
  "conversations": [
    {
      "id": "clx123...",
      "contact": {
        "id": "clx456...",
        "name": "Sophie Martin",
        "phone": "+33612345678"
      },
      "status": "OPEN",
      "lastActivityAt": "2025-01-20T10:30:00Z",
      "messagesCount": 15
    }
  ],
  "nextCursor": "clx999...",
  "hasMore": true
}
```

#### GET `/api/conversations/:id/messages`
Récupère les messages d'une conversation.

**Query** :
- `limit` : 50 (défaut)
- `cursor` : ID du dernier message

**Response** :
```json
{
  "messages": [
    {
      "id": "clx789...",
      "direction": "IN",
      "text": "Bonjour, je suis intéressé",
      "timestamp": "2025-01-20T10:00:00Z"
    },
    {
      "id": "clx790...",
      "direction": "OUT",
      "text": "Bonjour Sophie! Comment puis-je vous aider?",
      "timestamp": "2025-01-20T10:00:05Z"
    }
  ],
  "nextCursor": "clx800...",
  "hasMore": false
}
```

#### POST `/api/conversations/:id/messages`
Envoie un message manuel (réponse humaine).

**Body** :
```json
{
  "text": "Merci pour votre patience, voici la réponse...",
  "agentKey": "human" // Optionnel
}
```

**Response** : 201 Created
```json
{
  "message": {
    "id": "clx801...",
    "direction": "OUT",
    "text": "Merci pour votre patience...",
    "timestamp": "2025-01-20T11:00:00Z"
  }
}
```

#### PATCH `/api/conversations/:id`
Met à jour le statut d'une conversation.

**Body** :
```json
{
  "status": "CLOSED"
}
```

## Installation

### 1. Prérequis

- Node.js 18+
- PostgreSQL 16
- npm ou yarn

### 2. Setup Backend

```bash
cd skybot-inbox

# Installer les dépendances
npm install

# Configurer .env
cp .env.example .env
# Éditer .env avec vos credentials

# Générer le client Prisma
npx prisma generate

# Lancer les migrations
npx prisma migrate dev

# Seed la DB (optionnel)
npx prisma db seed

# Démarrer en mode dev
npm run start:dev
```

Le backend démarre sur `http://localhost:3000`.

### 3. Setup Frontend

```bash
cd skybot-inbox-ui

# Installer les dépendances
npm install

# Configurer .env.local
cp .env.example .env.local
# Éditer .env.local

# Démarrer en mode dev
npm run dev
```

Le frontend démarre sur `http://localhost:3001`.

## Configuration

### Variables d'Environnement (Backend)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/skybot_inbox"

# n8n Integration
N8N_MASTER_ROUTER_URL="https://vmilliand.app.n8n.cloud/webhook/master-router"
N8N_MASTER_ROUTER_SECRET="your_master_router_secret_here"

# WhatsApp
WHATSAPP_VERIFY_TOKEN="your_verify_token_here"

# Server
PORT=3000
NODE_ENV=development
```

### Variables d'Environnement (Frontend)

```bash
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

## Tests

### Backend

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend

```bash
# Unit tests (Vitest ou Jest)
npm run test
```

## Déploiement

### Backend (Production)

```bash
# Build
npm run build

# Migrate DB
npx prisma migrate deploy

# Start
npm run start:prod
```

**Recommandation** : Utiliser PM2 ou Docker pour gérer le processus.

### Frontend (Production)

```bash
# Build
npm run build

# Start
npm run start
```

**Recommandation** : Déployer sur Vercel, Netlify, ou serveur Node.js.

## Intégration avec n8n

### Format de Payload vers n8n

```json
{
  "message": "Texte du message utilisateur",
  "user_phone": "+33612345678",
  "user_name": "Sophie Martin",
  "conversation_id": "clx123...",
  "requestId": "req_456...",
  "clientKey": "nexxa"
}
```

### Format de Réponse de n8n

**Format 1** (Recommandé) :
```json
{
  "replyText": "Réponse de l'agent"
}
```

**Format 2** :
```json
{
  "output": {
    "message": "Réponse de l'agent"
  }
}
```

**Format 3** :
```json
{
  "output": {
    "answer": "Réponse de l'agent"
  }
}
```

### Routing Logs (Airtable)

Chaque appel à un agent crée un log dans Airtable :

```javascript
{
  conversation_id: "clx123...",
  from_agent: "master-router",
  to_agent: "crm",
  routing_reason: "memory",
  status: "FORWARDED",
  latency_ms: 1234,
  timestamp: "2025-01-20T10:00:00Z",
  client_key: "nexxa"
}
```

## Architecture Frontend

### Pages

- `/` - Dashboard (stats globales)
- `/inbox` - Liste des conversations
- `/inbox/[conversationId]` - Conversation détaillée
- `/crm` - CRM + Analytics combinés (TODO)
- `/alerts` - Escalations et notifications (TODO)
- `/settings` - Paramètres utilisateur (TODO)

### Components

#### `InboxView.tsx`
Composant principal avec :
- Liste des conversations (sidebar)
- Thread de messages (main)
- Input pour répondre manuellement

#### `ConversationList.tsx`
Liste des conversations avec :
- Avatar + nom du contact
- Dernier message (preview)
- Badge de statut (OPEN/CLOSED)
- Compteur de messages non lus

#### `MessageThread.tsx`
Thread de messages avec :
- Messages IN (alignés à gauche)
- Messages OUT (alignés à droite)
- Timestamps
- Indicateurs de statut (sent, delivered, read)

## Monitoring et Logs

### Logs NestJS

Les logs sont automatiquement générés par NestJS :

```bash
[Nest] INFO [WebhooksService] Processing WhatsApp message from +33612345678
[Nest] INFO [AgentsService] Triggering agent: crm for conversation: clx123...
[Nest] INFO [AgentsService] Agent crm responded in 1234ms
```

### Logs Airtable

Tous les appels aux agents sont loggés dans Airtable table `routing_logs` :

```
conversation_id | from_agent      | to_agent | status    | latency_ms | timestamp
clx123...       | master-router   | crm      | FORWARDED | 1234       | 2025-01-20 10:00:00
```

## Sécurité

### Validation WhatsApp Webhook

Tous les webhooks WhatsApp sont validés avec HMAC-SHA256 :

```typescript
const signature = req.headers['x-hub-signature-256'];
const hmac = crypto.createHmac('sha256', WHATSAPP_APP_SECRET);
hmac.update(JSON.stringify(req.body));
const expectedSignature = `sha256=${hmac.digest('hex')}`;

if (signature !== expectedSignature) {
  throw new UnauthorizedException('Invalid signature');
}
```

### Rate Limiting

Throttler configuré à 120 requêtes / 60 secondes par IP.

```typescript
@UseGuards(ThrottlerGuard)
@Controller('webhooks')
export class WebhooksController { ... }
```

### Multi-Tenant Isolation

Chaque requête filtre par `accountId` ou `clientKey` pour isoler les données entre clients.

```typescript
// Exemple : Récupérer les conversations d'un client
const conversations = await prisma.conversation.findMany({
  where: {
    inbox: {
      accountId: accountId
    }
  }
});
```

## Roadmap

### Phase 1 : Stabilisation (PRIORITÉ #1)
- [x] Architecture backend NestJS
- [x] Webhooks WhatsApp
- [x] Intégration n8n agents
- [x] Frontend Next.js basique
- [ ] Tests end-to-end complets
- [ ] Déploiement production

### Phase 2 : Features Essentielles (AVANT SAMEDI 17h CET)
- [ ] Page CRM + Analytics combinée
- [ ] Page Alerts (escalations)
- [ ] Réponse manuelle dans Alerts
- [ ] Page Settings (theme switcher)

### Phase 3 : Optimisations
- [ ] Authentication (JWT + Passport)
- [ ] Notifications temps réel (WebSocket ou SSE)
- [ ] Support multi-canal (Telegram, Email)
- [ ] Analytics avancées (dashboards)
- [ ] A/B testing des prompts

## Support

### Issues
- Créer une issue GitHub avec :
  - Description du problème
  - Steps to reproduce
  - Logs backend et frontend

### Documentation Additionnelle
- **SkyBot README.md** : Vue d'ensemble des agents n8n
- **IMPORT_GUIDE.md** : Import des agents dans n8n
- **CLIENT_INTEGRATION_GUIDE.md** : Guide d'intégration client

## License

Propriétaire - SkyCode Agency

---

**Last Updated** : 2026-01-20
**Version** : 1.0.0
**Status** : 🟡 In Development (Phase 1 - Stabilisation)

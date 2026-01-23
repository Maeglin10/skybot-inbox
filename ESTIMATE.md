# SkyBot Estimation Package

## Project Overview

SkyBot is a WhatsApp automation platform with two main components:

1. **skybot-inbox** (NestJS Backend)
   - WhatsApp webhook ingestion
   - Multi-tenant client configuration
   - Conversation routing to n8n agents
   - Message persistence (PostgreSQL + Prisma)

2. **SkyBot** (n8n Workflows)
   - Master Router: classifies incoming messages
   - Agent workflows: CRM, Setter, Closer, Orders, Booking, AfterSale, Info
   - Airtable integration for data persistence
   - OpenAI integration for NLP

## Architecture Flow

```
WhatsApp Cloud API
       ↓
   Meta Webhook
       ↓
┌──────────────────┐
│  skybot-inbox    │  (NestJS on Render)
│  /webhooks/wa    │
└────────┬─────────┘
         ↓
   Signature validation
   Contact/Conv upsert
   Message persistence
         ↓
┌──────────────────┐
│  n8n Cloud       │  (Master Router)
│  /webhook/master │
└────────┬─────────┘
         ↓
   GPT Classifier
   Route to Agent
         ↓
┌──────────────────┐
│  Agent Workflow  │  (CRM, Setter, etc.)
│  OpenAI + Airtable│
└────────┬─────────┘
         ↓
   replyText response
         ↓
   skybot-inbox saves OUT message
   (WhatsApp send handled separately)
```

## Key Files to Review

### skybot-inbox
| File | Purpose |
|------|---------|
| `src/agents/agents.service.ts` | Triggers n8n Master Router |
| `src/webhooks/webhooks.service.ts` | WhatsApp webhook handler |
| `src/clients/clients.service.ts` | Multi-tenant resolution |
| `prisma/schema.prisma` | Database schema |

### SkyBot (n8n)
| File | Purpose |
|------|---------|
| `agents/core/master-router.json` | Main routing workflow |
| `agents/sales/setter.json` | Lead qualification |
| `agents/service/crm.json` | CRM operations |
| `N8N-IMPORT-GUIDE.md` | Agent configuration docs |

## Known Issues / TODOs

1. **Master Router GPT Classifier**: Currently uses OpenAI Assistant API - may need migration to Chat Completions for cost optimization
2. **Airtable rate limits**: No retry logic implemented yet
3. **WhatsApp send**: Not yet integrated (currently manual or via n8n)
4. **UI (skybot-inbox-ui)**: Next.js frontend - incomplete, needs conversation list + thread view

## What NOT to Estimate

- n8n Cloud subscription/hosting
- Meta Business verification
- Airtable schema design (already done)
- OpenAI Assistant configuration (already done)

## Estimation Scope

Please estimate:
1. Remaining backend work (webhook error handling, retry logic)
2. UI completion (inbox view, conversation threading)
3. WhatsApp send integration
4. Testing + deployment pipeline

## Tech Stack

- **Backend**: NestJS, Prisma, PostgreSQL
- **Frontend**: Next.js 15, React, TailwindCSS, shadcn/ui
- **Workflows**: n8n Cloud
- **Database**: Airtable (CRM data), PostgreSQL (inbox data)
- **AI**: OpenAI Assistants API
- **Hosting**: Render.com

## Local Setup

1. Clone repos
2. Copy `.env.example` to `.env`
3. Fill in placeholder values
4. `npm install && npx prisma migrate dev && npm run start:dev`

## Contact

For questions during estimation: [Contact owner]

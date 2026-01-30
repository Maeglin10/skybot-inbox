# Quick Start Guide

Get SkyBot Inbox up and running in 10 minutes.

---

## Prerequisites

- **Node.js**: 18.x or 20.x
- **PostgreSQL**: 15.x or higher
- **npm**: 9.x or higher
- **Git**: Latest version

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Maeglin10/skybot-inbox.git
cd skybot-inbox
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Minimum required variables:**

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/skybot_inbox?schema=public"

# JWT Secrets (must be 32+ characters)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-minimum-32-chars"

# API Key
API_KEY="your-api-key-here"

# WhatsApp
WHATSAPP_ACCESS_TOKEN="your-whatsapp-token"
WHATSAPP_APP_SECRET="your-app-secret"
WHATSAPP_VERIFY_TOKEN="your-verify-token"

# N8N Integration
N8N_MASTER_ROUTER_URL="https://your-n8n.com/webhook/whatsapp-master-webhook"
N8N_MASTER_ROUTER_SECRET="your-shared-secret"
```

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for complete list.

### 4. Set Up Database

#### Option A: Local PostgreSQL (Development)

```bash
# Start PostgreSQL with Docker
npm run db:up

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed demo data (optional)
npx prisma db seed
```

#### Option B: Render.com Production Database

Update `DATABASE_URL` in `.env` with your Render PostgreSQL URL:

```bash
DATABASE_URL="postgresql://user:password@host.oregon-postgres.render.com/dbname"
```

Then run migrations:

```bash
npx prisma migrate deploy
npx prisma generate
```

### 5. Start the Application

#### Development Mode

```bash
npm run start:dev
```

The server will start at `http://localhost:3001`

#### Production Mode

```bash
npm run build
npm run start:prod
```

---

## Verify Installation

### 1. Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-30T12:00:00.000Z"
}
```

### 2. Database Connection

```bash
curl http://localhost:3001/ready
```

Expected response:
```json
{
  "status": "ok",
  "checks": {
    "database": "ok"
  }
}
```

### 3. Create Your First Admin Account

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "name": "Admin User",
    "accountName": "My Company"
  }'
```

### 4. Log In

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!"
  }'
```

Save the `accessToken` from the response.

---

## Next Steps

### For Developers

1. **Explore the Architecture**: Read [Architecture Overview](../architecture/OVERVIEW.md)
2. **Review Modules**: See [Module Index](../modules/INDEX.md)
3. **Set Up Development Environment**: Follow [Development Setup](../development/SETUP.md)
4. **Run Tests**: `npm test`

### For DevOps

1. **Configure Production**: See [Deployment Guide](../deployment/RENDER.md)
2. **Set Up Monitoring**: Configure [Monitoring & Logging](../deployment/MONITORING.md)
3. **Configure Webhooks**: Follow [Webhook Setup](../api/WEBHOOKS.md)

### For Integration

1. **API Documentation**: Review [REST API](../api/REST_API.md)
2. **Authentication**: Set up [API Authentication](../api/AUTHENTICATION.md)
3. **Webhooks**: Configure [Webhook Endpoints](../api/WEBHOOKS.md)

---

## Common Issues

### Database Connection Error

```
Error: Can't reach database server
```

**Solution**: Verify your `DATABASE_URL` is correct and the database is running.

```bash
# Test connection
psql $DATABASE_URL
```

### Port Already in Use

```
Error: Port 3001 is already in use
```

**Solution**: Change the port in `.env`:

```bash
PORT=3002
```

### Prisma Client Not Generated

```
Error: Cannot find module '@prisma/client'
```

**Solution**: Generate the Prisma client:

```bash
npx prisma generate
```

---

## Directory Structure

```
skybot-inbox/
├── docs/                    # Documentation
├── prisma/                  # Database schema & migrations
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/                     # Source code
│   ├── accounts/            # Account management
│   ├── auth/                # Authentication
│   ├── channels/            # Multi-channel framework
│   ├── conversations/       # Conversation management
│   ├── messages/            # Message handling
│   ├── webhooks/            # Webhook endpoints
│   ├── common/              # Shared utilities
│   ├── prisma/              # Prisma service
│   └── main.ts              # Application entry point
├── test/                    # E2E tests
├── scripts/                 # Utility scripts
├── .env                     # Environment variables (not committed)
├── .env.example             # Environment template
├── package.json
└── tsconfig.json
```

---

## Quick Reference

### Development Commands

```bash
# Start development server
npm run start:dev

# Run tests
npm test
npm run test:e2e
npm run test:cov

# Database
npm run db:up           # Start local Postgres
npm run db:down         # Stop local Postgres
npm run db:migrate      # Run migrations
npm run db:seed         # Seed data

# Build
npm run build
npm run start:prod
```

### Prisma Commands

```bash
# Generate client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name migration_name

# Open Prisma Studio (DB GUI)
npx prisma studio

# Reset database (DEV ONLY!)
npx prisma migrate reset
```

---

**You're all set! 🚀**

For detailed information, explore the complete [documentation index](../INDEX.md).

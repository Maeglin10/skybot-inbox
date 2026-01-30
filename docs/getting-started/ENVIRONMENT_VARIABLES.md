# Environment Variables Reference

Complete reference for all environment variables used in SkyBot Inbox.

---

## Configuration File

Environment variables are stored in `.env` file at the project root.

**IMPORTANT**: Never commit `.env` to git. Use `.env.example` as a template.

---

## Required Variables

### Database

#### `DATABASE_URL`
**Type**: Connection String
**Required**: Yes
**Description**: PostgreSQL connection URL
**Format**: `postgresql://username:password@host:port/database?schema=public`

**Examples**:
```bash
# Local development
DATABASE_URL="postgresql://skybot:skybot@localhost:5432/skybot_inbox_dev?schema=public"

# Render.com production
DATABASE_URL="postgresql://user:pass@host.oregon-postgres.render.com/dbname"
```

---

### Server Configuration

#### `PORT`
**Type**: Number
**Required**: No
**Default**: `3001`
**Description**: HTTP server port

```bash
PORT=3001
```

#### `NODE_ENV`
**Type**: Enum
**Required**: No
**Default**: `development`
**Values**: `development`, `production`, `test`
**Description**: Application environment

```bash
NODE_ENV=production
```

---

### Authentication & Security

#### `JWT_SECRET`
**Type**: String
**Required**: Yes
**Min Length**: 32 characters
**Description**: Secret for signing JWT access tokens (15 min expiry)

```bash
JWT_SECRET="your-super-secret-jwt-key-minimum-32-chars-here"
```

**Generate**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### `JWT_REFRESH_SECRET`
**Type**: String
**Required**: Yes
**Min Length**: 32 characters
**Description**: Secret for signing JWT refresh tokens (7 day expiry)

```bash
JWT_REFRESH_SECRET="your-super-secret-refresh-key-minimum-32-chars-here"
```

#### `API_KEY`
**Type**: String
**Required**: Yes
**Description**: Master API key for internal service authentication

```bash
API_KEY="your_api_key_here"
```

---

### WhatsApp Configuration

#### `WHATSAPP_ACCESS_TOKEN`
**Type**: String
**Required**: Yes (for WhatsApp)
**Description**: WhatsApp Cloud API access token from Meta
**Where to Get**: [Meta for Developers](https://developers.facebook.com/)

```bash
WHATSAPP_ACCESS_TOKEN="EAAxxxxx..."
```

#### `WHATSAPP_APP_SECRET`
**Type**: String
**Required**: Yes (for WhatsApp)
**Description**: Meta app secret for HMAC webhook validation
**Where to Get**: Meta App Dashboard → Settings → Basic

```bash
WHATSAPP_APP_SECRET="your_app_secret_here"
```

#### `WHATSAPP_VERIFY_TOKEN`
**Type**: String
**Required**: Yes (for WhatsApp)
**Description**: Token for webhook verification
**Note**: You create this yourself, then configure it in Meta App

```bash
WHATSAPP_VERIFY_TOKEN="your_custom_verify_token"
```

#### `WHATSAPP_PHONE_NUMBER_ID`
**Type**: String
**Required**: No
**Description**: Default WhatsApp Business phone number ID

```bash
WHATSAPP_PHONE_NUMBER_ID="123456789"
```

#### `WHATSAPP_BUSINESS_NUMBER`
**Type**: String
**Required**: No
**Description**: WhatsApp Business phone number (display purposes)

```bash
WHATSAPP_BUSINESS_NUMBER="+1234567890"
```

---

### Meta (Instagram + Facebook)

#### `META_APP_ID`
**Type**: String
**Required**: Yes (for IG/FB)
**Description**: Meta application ID
**Where to Get**: Meta App Dashboard → Settings → Basic

```bash
META_APP_ID="123456789012345"
```

#### `META_APP_SECRET`
**Type**: String
**Required**: Yes (for IG/FB)
**Description**: Meta application secret (same as WHATSAPP_APP_SECRET)

```bash
META_APP_SECRET="your_meta_app_secret"
```

#### `INSTAGRAM_APP_ID`
**Type**: String
**Required**: No
**Description**: Instagram-specific app ID (if different from META_APP_ID)

#### `INSTAGRAM_APP_SECRET`
**Type**: String
**Required**: No
**Description**: Instagram-specific app secret

---

### N8N Integration

#### `N8N_MASTER_ROUTER_URL`
**Type**: URL
**Required**: Yes (for N8N integration)
**Description**: N8N master webhook router endpoint

```bash
N8N_MASTER_ROUTER_URL="https://your-n8n.cloud/webhook/whatsapp-master-webhook"
```

#### `N8N_MASTER_ROUTER_NAME`
**Type**: String
**Required**: No
**Default**: `AUTH-INBOX-N8N`
**Description**: Router name for logging

```bash
N8N_MASTER_ROUTER_NAME="AUTH-INBOX-N8N"
```

#### `N8N_MASTER_ROUTER_SECRET`
**Type**: String
**Required**: Yes (for N8N)
**Description**: Shared secret for authenticating N8N webhooks
**Note**: Must match the secret configured in N8N

```bash
N8N_MASTER_ROUTER_SECRET="your_shared_secret_here"
```

#### `N8N_API_KEY`
**Type**: String
**Required**: No
**Description**: N8N API key for programmatic workflow deployment

```bash
N8N_API_KEY="your_n8n_api_key"
```

#### `N8N_WEBHOOK_BASE_URL`
**Type**: URL
**Required**: No
**Description**: Base URL for N8N webhooks

```bash
N8N_WEBHOOK_BASE_URL="https://your-n8n.cloud/webhook/"
```

---

### SkyBot API (Agent Deployment)

#### `SKYBOT_API_URL`
**Type**: URL
**Required**: No
**Default**: `http://localhost:8080`
**Description**: SkyBot agent deployment service URL

```bash
SKYBOT_API_URL="https://your-skybot-api.com"
```

#### `SKYBOT_API_KEY`
**Type**: String
**Required**: No
**Description**: API key for SkyBot service

```bash
SKYBOT_API_KEY="your_skybot_api_key"
```

#### `SKYBOT_WEBHOOK_SECRET`
**Type**: String
**Required**: No
**Description**: Secret for validating SkyBot webhooks

```bash
SKYBOT_WEBHOOK_SECRET="your_webhook_secret"
```

---

### Airtable Integration

#### `AIRTABLE_API_KEY`
**Type**: String
**Required**: No (for Airtable integration)
**Description**: Airtable personal access token
**Where to Get**: [Airtable Account](https://airtable.com/account) → Generate token

```bash
AIRTABLE_API_KEY="patXXXXXXXX..."
```

#### `AIRTABLE_BASE_ID`
**Type**: String
**Required**: No (for Airtable)
**Description**: Airtable base ID
**Where to Get**: Airtable URL → `https://airtable.com/{BASE_ID}/...`

```bash
AIRTABLE_BASE_ID="appXXXXXXXXXX"
```

---

### Encryption

#### `TOKENS_ENCRYPTION_KEY`
**Type**: Hex String
**Required**: Yes
**Length**: 64 hex characters (32 bytes)
**Description**: AES-256-GCM encryption key for OAuth tokens

```bash
TOKENS_ENCRYPTION_KEY="070859d942f2b0e8ccf992f6c2ddbecb6dd86a9e823f0e6134cb205690a55982"
```

**Generate**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Billing & Stripe

#### `BILLING_PORTAL_URL`
**Type**: URL
**Required**: No
**Description**: External billing portal URL

```bash
BILLING_PORTAL_URL="https://billing.skybot.com"
```

#### `BILLING_SSO_SECRET`
**Type**: String
**Required**: Yes (for billing SSO)
**Min Length**: 32 characters
**Description**: JWT secret for billing SSO tokens (5 min expiry)

```bash
BILLING_SSO_SECRET="your_billing_sso_secret_here"
```

**Generate**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

### Google OAuth (Optional)

#### `GOOGLE_CLIENT_ID`
**Type**: String
**Required**: No
**Description**: Google OAuth client ID
**Where to Get**: [Google Cloud Console](https://console.cloud.google.com/)

```bash
GOOGLE_CLIENT_ID="123456789-xxxxx.apps.googleusercontent.com"
```

#### `GOOGLE_CLIENT_SECRET`
**Type**: String
**Required**: No
**Description**: Google OAuth client secret

```bash
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxx"
```

#### `GOOGLE_CALLBACK_URL`
**Type**: URL
**Required**: No
**Default**: `{BASE_URL}/api/auth/google/callback`
**Description**: OAuth redirect URL

```bash
# Development
GOOGLE_CALLBACK_URL="http://localhost:3001/api/auth/google/callback"

# Production
GOOGLE_CALLBACK_URL="https://skybot-inbox.onrender.com/api/auth/google/callback"
```

---

### Monitoring & Observability

#### `LOG_LEVEL`
**Type**: Enum
**Required**: No
**Default**: `info`
**Values**: `error`, `warn`, `info`, `debug`
**Description**: Logging verbosity

```bash
LOG_LEVEL=info
```

#### `SENTRY_DSN`
**Type**: URL
**Required**: No
**Description**: Sentry error tracking DSN

```bash
SENTRY_DSN="https://xxxxx@sentry.io/12345"
```

#### `SENTRY_TRACES_SAMPLE_RATE`
**Type**: Number
**Required**: No
**Default**: `0.1`
**Range**: 0.0 - 1.0
**Description**: Percentage of traces to send to Sentry

```bash
SENTRY_TRACES_SAMPLE_RATE=0.1
```

---

### Render.com Deployment

#### `RENDER_API_KEY`
**Type**: String
**Required**: No
**Description**: Render API key for programmatic deployments

```bash
RENDER_API_KEY="rnd_xxxxx"
```

#### `RENDER_SERVICE_ID`
**Type**: String
**Required**: No
**Description**: Render service ID

```bash
RENDER_SERVICE_ID="srv-xxxxx"
```

#### `RENDER_DEPLOY_HOOK`
**Type**: URL
**Required**: No
**Description**: Render deploy hook URL for GitHub Actions

```bash
RENDER_DEPLOY_HOOK="https://api.render.com/deploy/srv-xxxxx?key=xxxxx"
```

#### `RENDER_APP_URL`
**Type**: URL
**Required**: Yes (for OAuth callbacks)
**Description**: Production app URL

```bash
RENDER_APP_URL="https://skybot-inbox.onrender.com"
```

---

### Frontend Configuration

#### `FRONTEND_URL`
**Type**: URL
**Required**: Yes
**Description**: Frontend application URL for CORS and redirects

```bash
# Development
FRONTEND_URL="http://localhost:3000"

# Production
FRONTEND_URL="https://inbox.skybot.com"
```

---

### Seed Data (Development)

#### `SEED_SECRET_KEY`
**Type**: String
**Required**: No
**Description**: Secret for triggering demo data seed via API
**Note**: Remove in production

```bash
SEED_SECRET_KEY="demo-seed-2024"
```

#### `SEED_VALENTIN_PASSWORD`
**Type**: SHA256 Hash
**Required**: No
**Description**: Pre-hashed password for seed accounts

---

### AI Providers (Future)

#### `OPENAI_API_KEY`
**Type**: String
**Required**: No
**Description**: OpenAI API key for GPT integration

```bash
OPENAI_API_KEY="sk-proj-xxxxx"
```

#### `ANTHROPIC_API_KEY`
**Type**: String
**Required**: No
**Description**: Anthropic API key for Claude integration

```bash
ANTHROPIC_API_KEY="sk-ant-xxxxx"
```

---

## Environment Files

### `.env` (Local Development)
Your personal environment file. **Never commit to git**.

### `.env.example` (Template)
Template with placeholders. Safe to commit.

### `.env.production` (Production)
Production-specific overrides. **Never commit to git** (in .gitignore).

### `.env.production.example`
Production template. Safe to commit.

---

## Security Best Practices

1. **Never commit secrets**: All `.env*` files except `.env.example` are in `.gitignore`
2. **Use strong secrets**: Minimum 32 characters for JWT secrets
3. **Rotate secrets regularly**: Change JWT secrets every 90 days
4. **Separate environments**: Use different secrets for dev/staging/prod
5. **Use secret managers**: Consider Vault, AWS Secrets Manager, or Render's secret management

---

## Generating Secrets

### Random Hex (32 bytes = 64 hex chars)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Random Base64 (for SSO)
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### UUID
```bash
node -e "console.log(require('crypto').randomUUID())"
```

---

## Validation

Run this command to validate your environment:

```bash
npm run validate:env
```

Missing required variables will be reported.

---

**Last Updated**: 2026-01-30
